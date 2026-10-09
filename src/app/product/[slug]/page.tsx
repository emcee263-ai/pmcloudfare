import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { SizeGuide } from '@/components/product/SizeGuide';
import { getProduct } from '@/lib/products';
import { formatPrice, getKind } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found' };

  const image = product.product_images[0]?.image_url;
  const description = product.description ?? 'PEACEMAGENTS minimal streetwear.';

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: product.name, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <section className="shell grid gap-10 py-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:py-14">
      <ProductGallery product={product} />

      <div className="lg:sticky lg:top-24 lg:self-start">
        {product.is_drop && (
          <span className="inline-block bg-crimson px-2 py-1 text-xs font-semibold">Drop</span>
        )}
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{product.name}</h1>
        <p className="mt-3 text-xl">{formatPrice(product.price)}</p>
        {product.description && <p className="mt-6 max-w-md text-mute">{product.description}</p>}

        <div className="mt-8">
          <ProductPurchase product={product} />
        </div>

        <div className="mt-10">
          <SizeGuide kind={getKind(product.name)} />
        </div>
      </div>
    </section>
  );
}
