import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { LegalPage } from '@/components/ui/LegalPage';
import { instagramLink, mailLink, phoneLink, SITE, whatsappLink } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Contact',
  description: 'Reach PEACEMAGENTS on WhatsApp, phone, email or Instagram.',
  path: '/contact',
});

export default function ContactPage() {
  const rows = [
    {
      label: 'WhatsApp',
      value: SITE.phoneDisplay,
      href: whatsappLink('Hi PEACEMAGENTS, I have a question.'),
      note: 'Fastest way to reach us',
      external: true,
    },
    { label: 'Phone', value: SITE.phoneDisplay, href: phoneLink(), note: 'Calls and SMS', external: false },
    { label: 'Email', value: SITE.email, href: mailLink('Question for PEACEMAGENTS'), note: 'Orders, sizing, anything else', external: false },
    { label: 'Instagram', value: `@${SITE.instagramHandle}`, href: instagramLink(), note: 'Drops and direct messages', external: true },
  ];

  return (
    <LegalPage
      title="Contact"
      showDate={false}
      intro="Questions about a piece, an order, sizing or delivery? Message us. If you are asking about an order, include the order reference from your confirmation email."
    >
      <ul className="divide-y divide-white/10 border-y border-white/10 xl:col-span-2">
        {rows.map((row) => (
          <li key={row.label}>
            <a
              href={row.href}
              {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex flex-wrap items-baseline justify-between gap-2 py-5 !no-underline hover:bg-surface"
            >
              <span>
                <span className="block text-sm text-mute">{row.label}</span>
                <span className="mt-1 block break-all text-lg font-semibold !text-white">{row.value}</span>
              </span>
              <span className="text-sm text-mute">{row.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </LegalPage>
  );
}
