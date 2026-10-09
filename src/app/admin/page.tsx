import type { Metadata } from 'next';
import { AdminInventory } from '@/components/admin/AdminInventory';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { getProducts } from '@/lib/products';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import type { Order } from '@/types';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };

export default async function AdminPage() {
  const products = await getProducts();

  let orders: Order[] = MOCK_ORDERS;
  if (isSupabaseConfigured) {
    // The middleware has already confirmed this visitor is an admin.
    const supabase = await createClient();
    const { data } = await supabase
      .from('orders')
      .select('id, user_id, status, total_amount, created_at, shipping_address')
      .order('created_at', { ascending: false })
      .limit(50);
    orders = (data ?? []) as unknown as Order[];
  }

  return (
    <section className="shell space-y-16 py-10 sm:py-16">
      <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">Admin</h1>
      {!isSupabaseConfigured && (
        <p className="max-w-xl bg-surface p-4 text-sm text-mute">
          Showing sample data. Connect Supabase to edit stock and order status.
        </p>
      )}
      <AdminInventory products={products} />
      <AdminOrders orders={orders} />
    </section>
  );
}
