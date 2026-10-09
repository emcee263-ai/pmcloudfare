'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatPrice, orderRef } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function call(url: string, init: RequestInit, done: string) {
    setBusy(true);
    setMessage(null);
    const res = await fetch(url, init).catch(() => null);
    const data = res ? ((await res.json().catch(() => ({}))) as { error?: string }) : {};
    setMessage(res && res.ok ? done : (data.error ?? 'Could not reach the server.'));
    setBusy(false);
    router.refresh();
  }

  const a = order.shipping_address;
  const canResend = order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered';

  return (
    <article className="bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Order {orderRef(order.id)}</p>
          <p className="text-sm text-mute">
            {new Date(order.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
            {formatPrice(order.total_amount)} · {order.payment_method}
            {order.payment_status ? ` (${order.payment_status})` : ''}
          </p>
        </div>
        <div>
          <label htmlFor={`status-${order.id}`} className="sr-only">Order status</label>
          <select
            id={`status-${order.id}`}
            value={order.status}
            disabled={busy || order.status === 'cancelled'}
            onChange={(e) =>
              call(
                `/api/admin/orders/${order.id}`,
                { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: e.target.value }) },
                'Status updated.',
              )
            }
            className="h-10 bg-surface-raised px-3 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {order.review_note && <p className="mt-4 border border-crimson p-3 text-sm">{order.review_note}</p>}
      {order.email_error && (
        <p className="mt-4 border border-white/30 p-3 text-sm">Confirmation email failed: {order.email_error}</p>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-mute">Items and delivery</summary>
        <ul className="mt-3 space-y-1">
          {order.order_items.map((i) => (
            <li key={i.id}>{i.quantity} x {i.product_name} <span className="text-mute">{i.size} / {i.color}</span></li>
          ))}
        </ul>
        <p className="mt-4 leading-relaxed">
          {a.full_name}<br />
          {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
          {a.city}{a.postal_code ? ` ${a.postal_code}` : ''}, {a.region}, {a.country}<br />
          {a.phone} · {order.email}
        </p>
        {order.paynow_reference && <p className="mt-2 text-mute">Paynow reference {order.paynow_reference}</p>}
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        {canResend && (
          <button
            type="button"
            disabled={busy}
            onClick={() => call(`/api/admin/orders/${order.id}/resend`, { method: 'POST' }, 'Confirmation email sent.')}
            className="btn-outline h-10"
          >
            {order.confirmation_sent_at ? 'Resend confirmation' : 'Send confirmation'}
          </button>
        )}
        {message && <span role="status" className="text-mute">{message}</span>}
      </div>
    </article>
  );
}
