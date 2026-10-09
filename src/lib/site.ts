// Business details shown around the site. Change them here and they update everywhere.

export const SITE = {
  name: 'PEACEMAGENTS',
  email: 'Jabulaniparkie8@icloud.com',
  phoneDisplay: '+263 78 305 7337',
  phoneHref: '+263783057337',
  whatsappNumber: '263783057337',
  instagramHandle: 'PEACEMAGENTS_WORLDWIDE',
  country: 'Zimbabwe',
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
