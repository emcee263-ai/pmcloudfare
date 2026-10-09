import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/cloudflare';
import { getProducts } from '@/lib/products';

// Reads the database, so it is built on request rather than at build time.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const pages = ['', '/shop', '/drops', '/lookbook', '/faq', '/contact', '/privacy', '/cookies', '/terms'].map((path) => ({
    url: `${origin}${path}`,
  }));

  try {
    const products = await getProducts();
    return [...pages, ...products.map((p) => ({ url: `${origin}/product/${p.slug}`, lastModified: p.created_at }))];
  } catch (error) {
    console.error('Sitemap could not read products:', error instanceof Error ? error.message : error);
    return pages;
  }
}
