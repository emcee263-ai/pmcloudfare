import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/ui/LegalPage';

export const metadata: Metadata = { title: 'Cookie policy' };

const ROWS = [
  {
    name: 'pm_session',
    kind: 'Cookie',
    purpose: 'Keeps you signed in to your account. Only set if you sign in or create an account.',
    lasts: '30 days, or until you sign out',
  },
  {
    name: 'peacemagents-cart',
    kind: 'Browser storage',
    purpose: 'Remembers the items in your bag on this device.',
    lasts: 'Until you check out or clear your browser data',
  },
  {
    name: 'pm-theme',
    kind: 'Browser storage',
    purpose: 'Remembers whether you chose the dark or the light theme.',
    lasts: 'Until you clear your browser data',
  },
  {
    name: 'pm-notice-seen',
    kind: 'Browser storage',
    purpose: 'Remembers that you have seen the cookie notice, so we do not show it again.',
    lasts: 'Until you clear your browser data',
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie policy"
      intro="We keep this simple: PEACEMAGENTS only uses what the shop needs to work. There are no advertising or tracking cookies."
    >
      <div className="xl:col-span-2">
        <h2>What we use</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-white">
                <th className="py-3 pr-4 font-semibold">Name</th>
                <th className="py-3 pr-4 font-semibold">Type</th>
                <th className="py-3 pr-4 font-semibold">What it does</th>
                <th className="py-3 font-semibold">How long</th>
              </tr>
            </thead>
            <tbody className="text-mute">
              {ROWS.map((row) => (
                <tr key={row.name} className="border-b border-white/10 align-top">
                  <td className="py-3 pr-4 font-mono text-xs text-white">{row.name}</td>
                  <td className="py-3 pr-4">{row.kind}</td>
                  <td className="py-3 pr-4">{row.purpose}</td>
                  <td className="py-3">{row.lasts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          These are strictly necessary for the shop to work, so they do not need your consent. You can block them in your
          browser settings, but the bag and sign-in will stop working.
        </p>
      </div>

      <div>
        <h2>Visitor statistics</h2>
        <p>
          We may count visits using Cloudflare Web Analytics. It does not use cookies, does not follow you across
          sites and does not build a profile of you. It shows us which pages are visited so we can improve the shop.
        </p>
      </div>

      <div>
        <h2>Third parties</h2>
        <p>
          When you pay by card or other wallet you leave this site and go to Paynow, which sets its own cookies under its
          own policy. Links to WhatsApp and Instagram work the same way once you open them.
        </p>
      </div>

      <div>
        <h2>More</h2>
        <p>
          Read how we handle personal data in our <Link href="/privacy">privacy policy</Link>.
        </p>
      </div>
    </LegalPage>
  );
}
