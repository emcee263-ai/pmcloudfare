import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    // /admin is left out on purpose: robots.txt is public, and listing it would point people at it.
    // Search engines cannot reach it anyway (visitors who are not signed in as admin get "not found").
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/checkout', '/order/', '/account', '/login', '/reset-password'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
