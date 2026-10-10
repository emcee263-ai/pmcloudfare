// Business details shown around the site. Change them here and they update everywhere.

export const SITE = {
  name: 'PEACEMAGENTS',
  email: 'Jabulaniparkie8@icloud.com',
  phoneDisplay: '+263 78 305 7337',
  phoneHref: '+263783057337',
  whatsappNumber: '263783057337',
  instagramHandle: 'PEACEMAGENTS_WORLDWIDE',
  country: 'Zimbabwe',
  countryCode: 'ZW',
  /** One line that describes the shop. Used for search results and link previews. */
  tagline: 'Minimal streetwear in small runs. Hoodies, tees and caps.',
  /** Longer description for search engines (keep it under about 160 characters). */
  description:
    'PEACEMAGENTS is a minimal streetwear label from Zimbabwe. Hoodies, tees and caps in small runs and limited drops. Pay with Ecocash, OneMoney or card.',
  /** Shown on the privacy and terms pages. */
  policyUpdated: '9 October 2026',
  /**
   * Shop policies quoted in the FAQ and terms. These are sensible starting points,
   * not legal advice. Check each one matches how you really run the shop.
   */
  returnDays: 7,
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function instagramLink() {
  return `https://instagram.com/${SITE.instagramHandle}`;
}

export function mailLink(subject: string, body = '') {
  const query = `subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
  return `mailto:${SITE.email}?${query}`;
}

export function phoneLink() {
  return `tel:${SITE.phoneHref}`;
}

/**
 * The public address of the site, used for search engines (canonical links, sitemap, structured data).
 * Set NEXT_PUBLIC_SITE_URL as a build variable once you have your own domain. Until then it uses the workers.dev address.
 */
const FALLBACK_URL = 'https://peacemagents.feremengamcgregor.workers.dev';
const CONFIGURED_URL = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_URL = (
  CONFIGURED_URL && !CONFIGURED_URL.includes('localhost') ? CONFIGURED_URL : FALLBACK_URL
).replace(/\/$/, '');
