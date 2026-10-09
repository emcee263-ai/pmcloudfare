import type { Metadata } from 'next';
import Link from 'next/link';
import { SignOutButton } from '@/components/account/SignOutButton';
import { OrderTracker } from '@/components/ui/OrderTracker';
import { requireUser } from '@/lib/auth';
import { listUserOrders } from '@/lib/orders';
import { formatPrice, orderRef } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Account', robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser('/account');
  const orders = await listUserOrders(user.id);

  return (
    <section className="shell py-10 sm:py-16">
      <h1 className="page-title font-display font-extrabold tracking-tight">Account</h1>
      <p className="mt-4 text-mute">{user.full_name ? `${user.full_name} · ` : ''}{user.email}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {user.role === 'admin' && <Link href="/admin" className="btn">Open admin</Link>}
        <SignOutButton />
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold">Orders</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-mute">No orders yet.</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {orders.map((order) => (
            <li key={order.id} className="bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/order/${order.id}`} className="font-semibold underline">
                  Order {orderRef(order.id)}
                </Link>
                <span className="text-sm text-mute">
                  {new Date(order.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })} · {formatPrice(order.total_amount)}
                </span>
              </div>
              <p className="mt-2 text-sm text-mute">
                {order.order_items.map((i) => `${i.quantity} x ${i.product_name} (${i.size})`).join(', ')}
              </p>
              <div className="mt-4"><OrderTracker status={order.status} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
