import { getEnv, getVar } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { getOrder } from '@/lib/orders';
import { formatPrice, orderRef } from '@/lib/utils';
import type { Order } from '@/types';

// Order emails go out through Cloudflare Email Service (the EMAIL binding).
// Sending must never break an order, so every function here returns a result instead of throwing.

export type SendResult = { ok: true } | { ok: false; error: string };

/** Accepts "Name <address@domain>" or a bare address. */
function parseFrom(value: string): { email: string; name?: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].replace(/^"|"$/g, '').trim();
    return name ? { email: match[2].trim(), name } : { email: match[2].trim() };
  }
  return { email: value.trim() };
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const binding = getEnv().EMAIL;
  const from = getVar('EMAIL_FROM');
  if (!binding) return { ok: false, error: 'Email is not set up: the EMAIL binding is missing.' };
  if (!from) return { ok: false, error: 'Email is not set up: EMAIL_FROM is empty.' };

  try {
    await binding.send({
      to: message.to,
      from: parseFrom(from),
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });
    return { ok: true };
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    console.error('Email send failed:', text);
    return { ok: false, error: text.slice(0, 300) };
  }
}

// ---------- templates ----------

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function addressLines(order: Order) {
  const a = order.shipping_address;
  return [
    a.full_name,
    a.line1,
    a.line2,
    [a.city, a.postal_code].filter(Boolean).join(' '),
    [a.region, a.country].filter(Boolean).join(', '),
    a.phone,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

function paymentLabel(order: Order) {
  if (order.payment_method === 'ecocash') return 'Ecocash';
  if (order.payment_method === 'onemoney') return 'OneMoney';
  return 'Card or other (Paynow)';
}

function layout(title: string, intro: string, body: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:Helvetica,Arial,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;">
        <tr><td style="padding:28px 32px;background:#0a0a0a;color:#ffffff;font-size:14px;letter-spacing:6px;font-weight:700;">PEACEMAGENTS</td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;">${esc(title)}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">${intro}</p>
          ${body}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(order: Order) {
  const rows = order.order_items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e5e5e2;font-size:14px;line-height:1.5;">
          <strong>${esc(item.product_name)}</strong><br>
          <span style="color:#666;">${esc(item.size)} / ${esc(item.color)} &times; ${item.quantity}</span>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #e5e5e2;font-size:14px;white-space:nowrap;">${formatPrice(item.price_at_purchase * item.quantity)}</td>
      </tr>`,
    )
    .join('');

  const discount =
    order.discount > 0
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#666;">Discount${order.coupon_code ? ` (${esc(order.coupon_code)})` : ''}</td><td align="right" style="padding:6px 0;font-size:14px;color:#666;">-${formatPrice(order.discount)}</td></tr>`
      : '';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    ${rows}
    ${discount}
    <tr><td style="padding:14px 0 0;font-size:15px;font-weight:700;">Total paid</td><td align="right" style="padding:14px 0 0;font-size:15px;font-weight:700;">${formatPrice(order.total_amount)}</td></tr>
  </table>`;
}

export function confirmationEmail(order: Order, origin: string) {
  const ref = orderRef(order.id);
  const link = `${origin}/order/${order.id}`;
  const name = order.shipping_address.full_name.split(' ')[0] || 'there';

  const html = layout(
    'Thank you. Your order is confirmed.',
    `Hi ${esc(name)}, we have received your payment and we are getting your order ready. Order reference <strong>${ref}</strong>.`,
    `${itemsTable(order)}
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:#888;">DELIVERING TO</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;">${addressLines(order).map(esc).join('<br>')}</p>
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:#888;">PAID WITH</p>
    <p style="margin:0 0 28px;font-size:14px;">${paymentLabel(order)}</p>
    <a href="${esc(link)}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:2px;padding:14px 24px;">VIEW YOUR ORDER</a>
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#888;">Questions? Just reply to this email.</p>`,
  );

  const text = [
    `Thank you. Your order is confirmed.`,
    ``,
    `Hi ${name}, we have received your payment and we are getting your order ready.`,
    `Order reference: ${ref}`,
    ``,
    ...order.order_items.map(
      (item) =>
        `${item.quantity} x ${item.product_name} (${item.size} / ${item.color})  ${formatPrice(item.price_at_purchase * item.quantity)}`,
    ),
    order.discount > 0 ? `Discount: -${formatPrice(order.discount)}` : '',
    `Total paid: ${formatPrice(order.total_amount)}`,
    ``,
    `Delivering to:`,
    ...addressLines(order),
    ``,
    `Paid with: ${paymentLabel(order)}`,
    `View your order: ${link}`,
    ``,
    `Questions? Just reply to this email.`,
    `PEACEMAGENTS`,
  ]
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .join('\n');

  return { subject: `Order ${ref} confirmed - PEACEMAGENTS`, html, text };
}

function adminAlertEmail(order: Order, origin: string) {
  const ref = orderRef(order.id);
  const link = `${origin}/admin/orders`;

  const html = layout(
    `New paid order ${ref}`,
    `${esc(order.shipping_address.full_name)} (${esc(order.email)}) paid ${formatPrice(order.total_amount)} with ${paymentLabel(order)}.`,
    `${itemsTable(order)}
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:#888;">SHIP TO</p>
    <p style="margin:0 0 28px;font-size:14px;line-height:1.6;">${addressLines(order).map(esc).join('<br>')}</p>
    <a href="${esc(link)}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:2px;padding:14px 24px;">OPEN ORDERS</a>`,
  );

  const text = [
    `New paid order ${ref}`,
    `${order.shipping_address.full_name} (${order.email}) paid ${formatPrice(order.total_amount)} with ${paymentLabel(order)}.`,
    ``,
    ...order.order_items.map((item) => `${item.quantity} x ${item.product_name} (${item.size} / ${item.color})`),
    ``,
    `Ship to:`,
    ...addressLines(order),
    ``,
    `Open orders: ${link}`,
  ].join('\n');

  return { subject: `New order ${ref} - ${formatPrice(order.total_amount)}`, html, text };
}

// ---------- sending for an order ----------

/**
 * Sends the customer's confirmation, and optionally a copy to the owner.
 * Without `force` it sends at most once per order, however many times it is called.
 * With `force` (the owner's Resend button) it always sends.
 */
export async function notifyOrderPaid(
  orderId: string,
  origin: string,
  options: { adminCopy?: boolean; force?: boolean } = {},
): Promise<SendResult> {
  try {
    const db = await getDb();
    const now = new Date().toISOString();

    if (!options.force) {
      const claim = await db
        .prepare('UPDATE orders SET confirmation_sent_at = ? WHERE id = ? AND confirmation_sent_at IS NULL')
        .bind(now, orderId)
        .run();
      if (claim.meta.changes !== 1) return { ok: true };
    }

    const order = await getOrder(orderId);
    if (!order) return { ok: false, error: 'Order not found.' };

    const result = await sendEmail({
      to: order.email,
      ...confirmationEmail(order, origin),
      replyTo: getVar('ADMIN_EMAIL'),
    });

    if (result.ok) {
      await db
        .prepare('UPDATE orders SET confirmation_sent_at = ?, email_error = NULL WHERE id = ?')
        .bind(now, orderId)
        .run();
    } else {
      // Release the claim so the owner can resend, and keep the reason where they can see it.
      await db
        .prepare('UPDATE orders SET confirmation_sent_at = NULL, email_error = ? WHERE id = ?')
        .bind(result.error, orderId)
        .run();
    }

    const adminAddress = getVar('ADMIN_EMAIL');
    if (options.adminCopy && adminAddress) {
      const copy = await sendEmail({ to: adminAddress, ...adminAlertEmail(order, origin) });
      if (!copy.ok) console.error('Owner alert email failed:', copy.error);
    }

    return result;
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    console.error('Order email failed:', text);
    return { ok: false, error: text.slice(0, 300) };
  }
}

// ---------- password reset ----------

export async function sendPasswordResetEmail(to: string, link: string): Promise<SendResult> {
  const html = layout(
    'Choose a new password',
    'Someone asked to reset the password on your PEACEMAGENTS account. If that was you, use the button below. The link works once and expires in one hour.',
    `<a href="${esc(link)}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:2px;padding:14px 24px;">CHOOSE A NEW PASSWORD</a>
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#888;">If it was not you, ignore this email. Your password stays the same.</p>`,
  );
  const text = [
    'Choose a new password',
    '',
    'Someone asked to reset the password on your PEACEMAGENTS account.',
    'If that was you, open this link. It works once and expires in one hour:',
    link,
    '',
    'If it was not you, ignore this email. Your password stays the same.',
  ].join('\n');
  return sendEmail({ to, subject: 'Reset your PEACEMAGENTS password', html, text });
}
