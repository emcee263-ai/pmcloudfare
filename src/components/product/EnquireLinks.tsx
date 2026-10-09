import { instagramLink, mailLink, phoneLink, SITE, whatsappLink } from '@/lib/site';

/** Ways to ask about a product before buying. Plain links, so they work without scripts. */
export function EnquireLinks({ name, url }: { name: string; url: string }) {
  const message = `Hi PEACEMAGENTS, I have a question about ${name}. ${url}`;
  const items = [
    { label: 'WhatsApp', href: whatsappLink(message), external: true },
    { label: 'Email', href: mailLink(`Question about ${name}`, `${message}\n`), external: false },
    { label: 'Call', href: phoneLink(), external: false },
    { label: 'Instagram', href: instagramLink(), external: true },
  ];

  return (
    <section aria-labelledby="enquire-heading" className="border-t border-white/10 pt-8">
      <h2 id="enquire-heading" className="font-display text-xl font-bold">
        Questions about this piece?
      </h2>
      <p className="mt-2 text-sm text-mute">
        Ask about sizing, stock or delivery. We reply on WhatsApp fastest. Instagram: @{SITE.instagramHandle}
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="btn-outline w-full"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
