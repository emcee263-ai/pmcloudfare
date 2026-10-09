import { NextResponse } from 'next/server';
import { getDiscountRate } from '@/lib/coupons';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { round2 } from '@/lib/utils';
import { checkoutSchema } from '@/lib/validation';

interface VariantRow {
  id: string;
  stock_quantity: number;
  size: string;
  products: { price: number | string; name: string } | null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Check the delivery details and try again.' }, { status: 400 });
  }

  const { address, items, couponCode } = parsed.data;

  // Demo mode: no database yet, so pretend the order was placed.
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const orderId = `demo-${crypto.randomUUID()}`;
    return NextResponse.json({ orderId, redirectUrl: `/checkout/success?order=${orderId}` });
  }

  const admin = createAdminClient();

  // Prices and stock always come from the database, never from the browser.
  const { data, error } = await admin
    .from('product_variants')
    .select('id, stock_quantity, size, products(price, name)')
    .in('id', items.map((i) => i.variantId));

  if (error || !data) {
    return NextResponse.json({ error: 'Could not check stock. Try again.' }, { status: 500 });
  }

  const rows = data as unknown as VariantRow[];
  let subtotal = 0;
  const lines: { variant_id: string; quantity: number; price_at_purchase: number }[] = [];

  for (const item of items) {
    const row = rows.find((r) => r.id === item.variantId);
    if (!row || !row.products) {
      return NextResponse.json({ error: 'An item in your cart is no longer available.' }, { status: 409 });
    }
    if (row.stock_quantity < item.quantity) {
      return NextResponse.json(
        { error: `${row.products.name} (${row.size}) has only ${row.stock_quantity} left.` },
        { status: 409 },
      );
    }
    const price = Number(row.products.price);
    subtotal += price * item.quantity;
    lines.push({ variant_id: row.id, quantity: item.quantity, price_at_purchase: price });
  }

  const total = round2(subtotal - subtotal * getDiscountRate(couponCode));

  // Attach the order to the signed-in customer when there is one. Guests are allowed.
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      status: 'pending',
      total_amount: total,
      shipping_address: address,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Could not create your order. Try again.' }, { status: 500 });
  }

  const { error: itemsError } = await admin
    .from('order_items')
    .insert(lines.map((l) => ({ ...l, order_id: order.id })));

  if (itemsError) {
    await admin.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: 'Could not save your order items. Try again.' }, { status: 500 });
  }

  // TODO (payment phase): create the payment here and return its hosted URL instead.
  //   card    -> Stripe Checkout Session with metadata { orderId: order.id }
  //   ecocash -> Paynow mobile payment request
  //   paynow  -> Paynow web payment redirect
  // The payment webhook then sets orders.status to 'paid' and decrements
  // product_variants.stock_quantity.
  return NextResponse.json({
    orderId: order.id,
    redirectUrl: `/checkout/success?order=${order.id}`,
  });
}
