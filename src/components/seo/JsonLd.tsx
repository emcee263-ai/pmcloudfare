import { serializeJsonLd } from '@/lib/seo';

/** Adds structured data (JSON-LD) to the page so search engines can read the shop, products and prices. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
