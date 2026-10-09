import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { requestOrigin } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { getOrderStats } from '@/lib/orders';
import { expireStaleOrders } from '@/lib/payments';
import { getLowStock } from '@/lib/products';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  await requireAdmin();
  const db = await getDb();
  await expireStaleOrders(db, await requestOrigin());

  const [stats, low, review] = await Promise.all([
    getOrderStats(),
    getLowStock(5),
    db
      .prepare('SELECT COUNT(*) AS count FROM orders WHERE review_note IS NOT NULL')
      .first<{ count: number }>(),
  ]);

  const cards = [
    { label: 'Revenue (paid orders)', value: formatPrice(stats.revenue) },
    { label: 'Waiting for payment', value: String(stats.byStatus.pending ?? 0) },
    { label: 'To ship', value: String(stats.byStatus.paid ?? 0) },
    { label: 'Shipped', value: String(stats.byStatus.shipped ?? 0) },
  ];

  return (
    <div className="space-y-12">
      <h1 className="page-title font-display font-extrabold tracking-tight">Overview</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface p-5">
            <p className="text-sm text-mute">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {review && review.count > 0 && (
        <p className="bg-surface p-5 text-sm">
          {review.count} order{review.count === 1 ? ' needs' : 's need'} your attention.{' '}
          <Link href="/admin/orders" className="underline">Open orders</Link>
        </p>
      )}

      <div>
        <h2 className="font-display text-2xl font-bold">Running low</h2>
        {low.length === 0 ? (
          <p className="mt-4 text-mute">Every size has more than 5 in stock.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
            {low.map((item, i) => (
              <li key={i} className="flex justify-between py-3">
                <span>{item.product_name} <span className="text-mute">{item.size} / {item.color}</span></span>
                <span className={item.stock_quantity === 0 ? 'text-crimson' : ''}>
                  {item.stock_quantity === 0 ? 'Sold out' : `${item.stock_quantity} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
