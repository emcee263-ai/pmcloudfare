import { getCurrentUser, isThrottled, recordAttempt } from '@/lib/auth';
import { getVar, siteOrigin } from '@/lib/cloudflare';
import { getDiscountRate } from '@/lib/coupons';
import { getDb } from '@/lib/db';
import { clientIp, fail, json, parseJson } from '@/lib/http';
import { cancelPendingOrder, createOrder, OutOfStockError, type NewOrderLine } from '@/lib/orders';
import { expireStaleOrders } from '@/lib/payments';
import { getPaynowConfig, initiateMobile, initiateWeb, PaynowError } from '@/lib/paynow';
import { orderRef } from '@/lib/utils';
import { checkoutSchema, normaliseZimPhone } from '@/lib/validation';

interface VariantRow {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  name: string;
  price_cents: number;
  is_active: number;
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, checkoutSchema);
  if (!parsed.ok) return parsed.response;
  const { address, paymentMethod, couponCode } = parsed.data;

  const paynow = getPaynowConfig();
  if (!paynow) return fail('Payments are not switched on yet. Please try again later.', 503);

  // Each checkout holds stock until it is paid or expires, so cap how fast one visitor can start them.
  const throttleKey = `checkout:${clientIp(request)}`;
  if (await isThrottled(throttleKey, 10)) {
    return fail('Too many checkouts started. Wait a few minutes and try again.', 429);
  }
  await recordAttempt(throttleKey, 900);

  const db = await getDb();
  const origin = siteOrigin(request);
  await expireStaleOrders(db, origin);

  // The same size added twice becomes one line.
  const wanted = new Map<string, number>();
  for (const item of parsed.data.items) {
    wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + item.quantity);
  }
  const ids = [...wanted.keys()];

  // Prices and names come from the database. Nothing the browser sends is trusted for money.
  const { results: variants } = await db
    .prepare(
      `SELECT v.id, v.size, v.color, v.stock_quantity, p.name, p.price_cents, p.is_active
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id IN (${ids.map(() => '?').join(', ')})`,
    )
    .bind(...ids)
    .all<VariantRow>();
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines: NewOrderLine[] = [];
  for (const [variantId, quantity] of wanted) {
    const variant = byId.get(variantId);
    if (!variant || variant.is_active !== 1) {
      return fail('Something in your bag is no longer available. Remove it and try again.', 409);
    }
    if (variant.stock_quantity < quantity) {
      const left = variant.stock_quantity;
      return fail(
        left > 0
          ? `Only ${left} left of ${variant.name} in ${variant.size}. Lower the quantity and try again.`
          : `${variant.name} in ${variant.size} just sold out. Remove it and try again.`,
        409,
      );
    }
    lines.push({
      variantId,
      productName: variant.name,
      size: variant.size,
      color: variant.color,
      quantity,
      priceCents: variant.price_cents,
    });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const discountCents = Math.round(subtotalCents * getDiscountRate(couponCode));
  const totalCents = subtotalCents - discountCents;
  if (totalCents <= 0) return fail('The order total must be more than zero.', 400);

  const user = await getCurrentUser();

  let orderId: string;
  try {
    orderId = await createOrder(db, {
      userId: user?.id ?? null,
      email: address.email.toLowerCase(),
      paymentMethod,
      subtotalCents,
      discountCents,
      totalCents,
      couponCode: discountCents > 0 && couponCode ? couponCode.trim().toUpperCase() : null,
      address,
      lines,
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return fail('One of the items just sold out. Update your bag and try again.', 409);
    }
    throw error;
  }

  const common = {
    reference: orderId,
    amountCents: totalCents,
    info: `PEACEMAGENTS order ${orderRef(orderId)}`,
    returnUrl: `${origin}/order/${orderId}`,
    resultUrl: `${origin}/api/paynow/result`,
    email: address.email,
  };

  try {
    if (paymentMethod === 'paynow') {
      const { redirectUrl, pollUrl } = await initiateWeb(paynow, common);
      await db
        .prepare("UPDATE orders SET paynow_poll_url = ?, payment_status = 'Created' WHERE id = ?")
        .bind(pollUrl, orderId)
        .run();
      return json({ orderId, redirectUrl }, 201);
    }

    const phone = normaliseZimPhone(parsed.data.mobileNumber ?? '');
    if (!phone) throw new PaynowError('Enter the mobile money number, for example 0771234567');

    const sent = await initiateMobile(paynow, { ...common, phone, method: paymentMethod });
    await db
      .prepare(
        "UPDATE orders SET paynow_poll_url = ?, paynow_reference = ?, payment_instructions = ?, payment_status = 'Sent' WHERE id = ?",
      )
      .bind(sent.pollUrl, sent.paynowReference, sent.instructions, orderId)
      .run();
    return json({ orderId, redirectUrl: `/order/${orderId}` }, 201);
  } catch (error) {
    console.error('Paynow could not start the payment:', error instanceof Error ? error.message : error);
    // Nothing was charged, so put the stock straight back.
    await cancelPendingOrder(db, orderId, 'Not started');
    // Paynow's own wording helps while testing, but visitors on the live shop get a plain message.
    const reason = error instanceof PaynowError && getVar('PAYNOW_TEST_MODE') === 'true' ? ` (${error.message})` : '';
    return fail(`We could not start the payment${reason}. Check the details and try again.`, 502);
  }
}
