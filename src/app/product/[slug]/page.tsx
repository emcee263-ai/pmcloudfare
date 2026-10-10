import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EnquireLinks } from '@/components/product/EnquireLinks';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductGallery } from '@/components/product/ProductGallery';
import { requestOrigin } from '@/lib/cloudflare';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { SizeGuide } from '@/components/product/SizeGuide';
import { getProduct } from '@/lib/products';
import { absoluteUrl, breadcrumbJsonLd, productJsonLd } from '@/lib/seo';
import { SITE } from '@/lib/site';
import { formatPrice, getKind } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found', robots: { index: false } };

  const image = product.product_images[0]?.image_url;
  const description = (
    product.description ?? `${product.name} by ${SITE.name}. Minimal streetwear from ${SITE.country}. Pay with Ecocash, OneMoney or card.`
  ).slice(0, 200);
  const path = `/product/${product.slug}`;
  const shareImage = image ? absoluteUrl(image) : absoluteUrl('/og.png');
  const shareTitle = `${product.name} | ${SITE.name}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      url: path,
      title: shareTitle,
      description,
      images: [{ url: shareImage, alt: product.name }],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [shareImage] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <>
    <JsonLd data={productJsonLd(product)} />
    <JsonLd
      data={breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/shop' },
        { name: product.name, path: `/product/${product.slug}` },
      ])}
    />
    <section className="shell grid gap-10 py-8 md:grid-cols-[1.25fr_1fr] md:gap-10 md:py-14 lg:gap-16">
      <ProductGallery product={product} />

      <div className="md:sticky md:top-24 md:self-start">
        {product.is_drop && (
          <span className="inline-block bg-crimson px-2 py-1 text-xs font-semibold text-[#fff]">Drop</span>
        )}
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{product.name}</h1>
        <p className="mt-3 text-xl">{formatPrice(product.price)}</p>
        {product.description && <p className="mt-6 max-w-md text-mute">{product.description}</p>}

        <div className="mt-8">
          <ProductPurchase product={product} />
        </div>

        <div className="mt-10">
          <EnquireLinks name={product.name} url={`${await requestOrigin()}/product/${product.slug}`} />
        </div>

        <div className="mt-10">
          <SizeGuide kind={getKind(product.name)} />
        </div>
      </div>
    </section>
    </>
  );
}
