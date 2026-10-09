import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { getProducts } from '@/lib/products';
import { cn, getKind } from '@/lib/utils';

export const metadata: Metadata = { title: 'Shop' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hoodie', label: 'Hoodies' },
  { key: 'tee', label: 'Tees' },
  { key: 'cap', label: 'Caps' },
  { key: 'bottom', label: 'Bottoms' },
] as const;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = 'all' } = await searchParams;
  const products = await getProducts();
  const visible = kind === 'all' ? products : products.filter((p) => getKind(p.name) === kind);

  return (
    <section className="shell py-10 sm:py-16">
      <h1 className="page-title font-display font-extrabold tracking-tight">Shop</h1>

      <nav aria-label="Filter by type" className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'all' ? '/shop' : `/shop?kind=${f.key}`}
            aria-current={kind === f.key ? 'true' : undefined}
            className={cn(
              'h-10 px-4 text-sm leading-10 transition-colors',
              kind === f.key ? 'bg-white text-black' : 'bg-surface text-mute hover:text-white',
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="mt-16 text-mute">Nothing in this category yet. Check back after the next drop.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {visible.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      )}
    </section>
  );
}
