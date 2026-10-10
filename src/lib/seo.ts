import type { Metadata } from 'next';
import { instagramLink, SITE, SITE_URL } from '@/lib/site';
import type { Product } from '@/types';

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? 'USD';

/**
 * Page title, description, canonical address and link-preview details in one go.
 * (A page that sets its own openGraph replaces the site-wide one, so every field is filled in here.)
 */
export function pageMeta({ title, description, path }: { title: string; description?: string; path: string }): Metadata {
  const text = description ?? SITE.description;
  const shareTitle = `${title} | ${SITE.name}`;
  return {
    title,
    description: text,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      url: path,
      title: shareTitle,
      description: text,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: `${SITE.name} streetwear` }],
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description: text, images: ['/og.png'] },
  };
}

/** Turns a link from the database (relative or full) into a full address. */
export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Makes JSON safe to place inside a <script> tag: a "<" can never close the tag early. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#organization`,
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    logo: absoluteUrl('/icon-512.png'),
    image: absoluteUrl('/og.png'),
    email: SITE.email,
    telephone: SITE.phoneHref,
    sameAs: [instagramLink()],
    address: { '@type': 'PostalAddress', addressCountry: SITE.countryCode },
    areaServed: SITE.countryCode,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: SITE.phoneHref,
        email: SITE.email,
        availableLanguage: ['English'],
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE.name,
    url: SITE_URL,
    description: SITE.tagline,
    inLanguage: 'en',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: Product) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const inStock = product.product_variants.some((v) => v.stock_quantity > 0);
  const images = [...product.product_images]
    .sort((a, b) => a.display_order - b.display_order)
    .map((i) => absoluteUrl(i.image_url));
  const sku = product.product_variants.find((v) => v.sku)?.sku ?? product.slug;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: product.description ?? `${product.name} by ${SITE.name}.`,
    sku,
    url,
    ...(images.length ? { image: images } : { image: [absoluteUrl('/og.png')] }),
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: CURRENCY,
      price: product.price.toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  };
}
