import Link from 'next/link';
import { SeedButton } from '@/components/admin/SeedButton';
import { requireAdmin } from '@/lib/auth';
import { getProducts } from '@/lib/products';
import { formatPrice, totalStock } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminProducts() {
  await requireAdmin();
  const products = await getProducts({ includeInactive: true });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="page-title font-display font-extrabold tracking-tight">Products</h1>
        <Link href="/admin/products/new" className="btn">New product</Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 max-w-md space-y-4">
          <p className="text-mute">No products yet. Add your first one, or load the sample products to see how the shop looks.</p>
          <SeedButton />
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-surface">
                <span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="ml-3 text-sm text-mute">{formatPrice(p.price)}</span>
                </span>
                <span className="flex items-center gap-3 text-sm text-mute">
                  {p.is_drop && <span className="bg-crimson px-2 py-0.5 text-xs font-semibold text-[#fff]">Drop</span>}
                  {!p.is_active && <span className="bg-surface-raised px-2 py-0.5 text-xs">Hidden</span>}
                  <span>{totalStock(p)} in stock</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
