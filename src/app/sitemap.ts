import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/products';
import { SITE_URL } from '@/lib/site';

// Reads the database, so it is built on request rather than at build time.
export const dynamic = 'force-dynamic';

const PAGES: { path: string; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; priority: number }[] = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/drops', changeFrequency: 'daily', priority: 0.8 },
  { path: '/lookbook', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  try {
    const products = await getProducts();
    return [
      ...pages,
      ...products.map((p) => ({
        url: `${SITE_URL}/product/${p.slug}`,
        lastModified: p.created_at,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error('Sitemap could not read products:', error instanceof Error ? error.message : error);
    return pages;
  }
}
