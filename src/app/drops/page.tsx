import type { Metadata } from 'next';
import Link from 'next/link';
import { Countdown } from '@/components/home/Countdown';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductImage } from '@/components/product/ProductImage';
import { getProducts } from '@/lib/products';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Drops' };
export const dynamic = 'force-dynamic';

export default async function DropsPage() {
  const products = (await getProducts()).filter((p) => p.is_drop);
  const now = Date.now();
  const upcoming = products.filter((p) => p.drop_at && new Date(p.drop_at).getTime() > now);
  const live = products.filter((p) => !p.drop_at || new Date(p.drop_at).getTime() <= now);

  return (
    <section className="shell py-10 sm:py-16">
      <h1 className="page-title font-display font-extrabold tracking-tight">Drops</h1>

      {products.length === 0 && (
        <p className="mt-10 max-w-md text-mute">No drops are scheduled right now. Check back soon.</p>
      )}

      {upcoming.length > 0 && (
        <div className="mt-12 space-y-3">
          <h2 className="font-display text-2xl font-bold">Coming up</h2>
          {upcoming.map((product) => (
            <article key={product.id} className="grid gap-6 bg-surface p-4 sm:grid-cols-[220px_1fr] sm:p-6">
              <ProductImage product={product} sizes="220px" />
              <div className="flex flex-col justify-between gap-6">
                <div>
                  <span className="inline-block bg-crimson px-2 py-1 text-xs font-semibold text-[#fff]">Drop</span>
                  <h3 className="mt-3 font-display text-3xl font-bold">{product.name}</h3>
                  {product.description && <p className="mt-2 max-w-lg text-mute">{product.description}</p>}
                  <p className="mt-2 text-sm">{formatPrice(product.price)}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {product.drop_at && <Countdown target={product.drop_at} />}
                  <Link href={`/product/${product.slug}`} className="btn-outline">
                    View details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {live.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold">Live now</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {live.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
