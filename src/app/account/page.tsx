import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/account/SignOutButton';
import { OrderTracker } from '@/components/ui/OrderTracker';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

export const metadata: Metadata = { title: 'Your account', robots: { index: false } };

async function loadAccount() {
  if (!isSupabaseConfigured) {
    return { email: null as string | null, orders: MOCK_ORDERS, demo: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  const { data } = await supabase
    .from('orders')
    .select(
      'id, status, total_amount, created_at, shipping_address, order_items(id, quantity, price_at_purchase, product_variants(size, color, products(name, slug)))',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return { email: user.email ?? null, orders: (data ?? []) as unknown as Order[], demo: false };
}

export default async function AccountPage() {
  const { email, orders, demo } = await loadAccount();
  const lastAddress = orders[0]?.shipping_address;

  return (
    <section className="shell py-10 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">Your orders</h1>
          {email && <p className="mt-3 text-mute">{email}</p>}
        </div>
        {!demo && <SignOutButton />}
      </div>

      {demo && (
        <p className="mt-8 max-w-xl bg-surface p-4 text-sm text-mute">
          This is sample data. Connect Supabase and sign in to see real orders.
        </p>
      )}

      {orders.length === 0 ? (
        <div className="mt-12">
          <p className="text-mute">You have not placed an order yet.</p>
          <Link href="/shop" className="btn mt-6">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold">Order {order.id.slice(0, 8)}</h2>
                  <p className="text-sm text-mute">
                    {new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="mt-5">
                  <OrderTracker status={order.status} />
                </div>

                <ul className="mt-5 divide-y divide-white/10 text-sm">
                  {order.order_items?.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4 py-2">
                      <span>
                        {item.product_variants?.products?.name ?? 'Item'}
                        <span className="text-mute">
                          {' '}
                          {item.product_variants?.size}, qty {item.quantity}
                        </span>
                      </span>
                      <span>{formatPrice(item.price_at_purchase * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </p>
              </li>
            ))}
          </ul>

          {lastAddress && (
            <aside className="h-fit bg-surface p-5 text-sm sm:p-6" aria-label="Saved address">
              <h2 className="font-display text-xl font-bold">Last delivery address</h2>
              <address className="mt-3 not-italic text-mute">
                {lastAddress.full_name}
                <br />
                {lastAddress.line1}
                {lastAddress.line2 ? `, ${lastAddress.line2}` : ''}
                <br />
                {lastAddress.city}, {lastAddress.region}
                <br />
                {lastAddress.country}
              </address>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
