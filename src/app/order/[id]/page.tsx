import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatusPoller } from '@/components/order/OrderStatusPoller';
import { OrderTracker } from '@/components/ui/OrderTracker';
import { requestOrigin } from '@/lib/cloudflare';
import { getOrder } from '@/lib/orders';
import { refreshOrder } from '@/lib/payments';
import { formatPrice, orderRef } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your order', robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  // Customers land here from Paynow, so ask Paynow for the latest before showing anything.
  await refreshOrder(id, await requestOrigin());
  const order = await getOrder(id);
  if (!order) notFound();

  const waiting = order.status === 'pending';
  const mobile = order.payment_method !== 'paynow';

  return (
    <section className="shell grid gap-12 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
      <div>
        <p className="text-sm text-mute">Order {orderRef(order.id)}</p>
        <h1 className="mt-2 page-title font-display font-extrabold tracking-tight">
          {waiting && (mobile ? 'Approve the payment on your phone' : 'Waiting for your payment')}
          {order.status === 'cancelled' && 'This order was not completed'}
          {!waiting && order.status !== 'cancelled' && 'Thank you. Your order is in.'}
        </h1>

        <div className="mt-8">
          <OrderTracker status={order.status} />
        </div>

        {waiting && (
          <div className="mt-8 bg-surface p-6 text-sm leading-relaxed">
            {mobile ? (
              <p>
                {order.payment_instructions ??
                  'We sent a payment request to your phone. Enter your PIN to approve it.'}
              </p>
            ) : (
              <p>
                If you were taken to Paynow and closed the page, you can start again from the shop. This page updates
                by itself once your payment goes through.
              </p>
            )}
            <p className="mt-3 text-mute">Keep this page open. It refreshes automatically.</p>
            <OrderStatusPoller orderId={order.id} />
          </div>
        )}

        {order.status === 'cancelled' && (
          <p className="mt-8 text-mute">
            The payment was cancelled or did not go through, and nothing was charged. Your items are back in the shop.{' '}
            <Link href="/shop" className="text-white underline">Continue shopping</Link>
          </p>
        )}

        {!waiting && order.status !== 'cancelled' && (
          <p className="mt-8 text-mute">
            {order.confirmation_sent_at
              ? `A confirmation was emailed to ${order.email}.`
              : `We will email a confirmation to ${order.email}.`}
          </p>
        )}
      </div>

      <aside className="h-fit bg-surface p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">Your items</h2>
        <ul className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <span>
                {item.product_name} <span className="text-mute">{item.size} / {item.color} x {item.quantity}</span>
              </span>
              <span>{formatPrice(item.price_at_purchase * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.total_amount)}</span>
        </p>
      </aside>
    </section>
  );
}
