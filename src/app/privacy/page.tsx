import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { LegalPage } from '@/components/ui/LegalPage';
import { mailLink, SITE } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Privacy policy',
  description: 'How PEACEMAGENTS collects, uses and protects your personal data.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This explains what personal information PEACEMAGENTS collects when you shop with us, why, and what you can ask us to do with it."
    >
      <div>
        <h2>Who we are</h2>
        <p>
          PEACEMAGENTS is a streetwear brand selling online in {SITE.country} and beyond. You can reach us at{' '}
          <a href={mailLink('Privacy question')}>{SITE.email}</a> or on WhatsApp at {SITE.phoneDisplay}.
        </p>
      </div>

      <div>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, email address, phone number and delivery address, which you give us at checkout.</li>
          <li>What you ordered, what it cost, when, and whether it was paid.</li>
          <li>If you create an account: your email and a scrambled (hashed) version of your password. We cannot read your password.</li>
          <li>The mobile money number you enter for Ecocash or OneMoney. It is passed to Paynow to send the payment request. We do not keep it.</li>
          <li>Messages you send us on WhatsApp, email, phone or Instagram.</li>
          <li>Basic technical data your browser sends with every request, such as your IP address, which we use to prevent abuse and to limit repeated sign-in attempts.</li>
        </ul>
      </div>

      <div>
        <h2>What we never see</h2>
        <p>
          Card numbers and mobile money PINs are entered on Paynow&apos;s own pages or on your phone. They never pass through
          or get stored on this website.
        </p>
      </div>

      <div>
        <h2>Why we use it</h2>
        <ul>
          <li>To take payment, prepare and deliver your order, and email you a confirmation.</li>
          <li>To answer your questions and handle returns.</li>
          <li>To keep your account secure and stop fraud and abuse.</li>
          <li>To keep records we are required to keep for accounting and the law.</li>
        </ul>
        <p className="mt-3">We do not sell your information and we do not send marketing emails without your say-so.</p>
      </div>

      <div>
        <h2>Who handles it for us</h2>
        <ul>
          <li><strong>Paynow</strong> processes payments (paynow.co.zw) and has its own privacy policy.</li>
          <li><strong>Google Fonts</strong> can supply the heading font. When it does, Google sees your IP address and browser details as part of sending the font file.</li>
          <li><strong>Cloudflare</strong> hosts the website, stores our database and sends our order emails. Your data may be processed on servers outside {SITE.country}.</li>
          <li>Delivery partners receive your name, phone number and address so they can deliver.</li>
        </ul>
        <p className="mt-3">
          We only share what each of them needs to do their job. We also share information when the law requires it.
        </p>
      </div>

      <div>
        <h2>How long we keep it</h2>
        <p>
          Order records are kept for as long as we need them for returns, accounting and legal reasons. Account details are
          kept until you ask us to delete the account. Sign-in sessions expire after 30 days.
        </p>
      </div>

      <div>
        <h2>Your rights</h2>
        <p>
          You can ask us to show you the information we hold about you, correct it, or delete it. Message us using any of the
          contact details above and we will deal with it within a reasonable time. Some order records may have to be kept
          after a deletion request because the law requires it. We aim to handle personal data in line with
          Zimbabwe&apos;s Cyber and Data Protection Act.
        </p>
      </div>

      <div>
        <h2>Security</h2>
        <p>
          Passwords are stored hashed, connections use HTTPS, repeated sign-in attempts are limited, and only the shop owner
          can open the admin area. No system is perfectly secure, so we cannot promise absolute protection.
        </p>
      </div>

      <div>
        <h2>Cookies</h2>
        <p>
          We use only the cookies and browser storage the shop needs to work. See our{' '}
          <Link href="/cookies">cookie policy</Link>.
        </p>
      </div>

      <div>
        <h2>Changes</h2>
        <p>If we change this policy we will update the date at the top of this page.</p>
      </div>
    </LegalPage>
  );
}
