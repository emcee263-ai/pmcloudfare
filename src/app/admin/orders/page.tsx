import { OrderCard } from '@/components/admin/OrderCard';
import { requireAdmin } from '@/lib/auth';
import { requestOrigin } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { listAllOrders } from '@/lib/orders';
import { expireStaleOrders } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export default async function AdminOrders() {
  await requireAdmin();
  await expireStaleOrders(await getDb(), await requestOrigin());
  const orders = await listAllOrders(100);

  return (
    <div>
      <h1 className="page-title font-display font-extrabold tracking-tight">Orders</h1>
      {orders.length === 0 ? (
        <p className="mt-10 text-mute">No orders yet.</p>
      ) : (
        <div className="mt-10 grid gap-3 xl:grid-cols-2">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
