import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/cloudflare';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/checkout', '/order/', '/account', '/login', '/reset-password'] }],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
