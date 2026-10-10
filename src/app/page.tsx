import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { Splash } from '@/components/home/Splash';
import { ProductCard } from '@/components/product/ProductCard';
import { getProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const products = await getProducts();

  // Show the next scheduled drop first, otherwise any product flagged as a drop.
  const now = Date.now();
  const drops = products
    .filter((p) => p.is_drop)
    .sort((a, b) => new Date(a.drop_at ?? 0).getTime() - new Date(b.drop_at ?? 0).getTime());
  const drop = drops.find((p) => p.drop_at && new Date(p.drop_at).getTime() > now) ?? drops[0] ?? null;

  const featured = products.slice(0, 4);

  return (
    <>
      <Splash />
      <Hero drop={drop} />

      <section className="shell py-16" aria-labelledby="featured-heading">
        <div className="mb-8 flex items-end justify-between">
          <h2 id="featured-heading" className="font-display text-3xl font-bold sm:text-4xl">
            Featured pieces
          </h2>
          <Link href="/shop" className="text-sm text-mute hover:text-white">
            View all
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-mute">No products yet. Add some in the admin panel.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 2} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface">
        <div className="shell py-20 sm:py-28">
          <p className="max-w-4xl font-display text-3xl font-bold leading-tight sm:text-5xl">
            Small runs, plain black, nothing extra. When a drop sells out, it is gone.
          </p>
        </div>
      </section>
    </>
  );
}
