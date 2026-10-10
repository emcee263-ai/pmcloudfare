import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { LegalPage } from '@/components/ui/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Terms of sale',
  description: 'Terms of sale for PEACEMAGENTS: prices, payment, delivery and returns.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of sale"
      intro="By placing an order with PEACEMAGENTS you agree to these terms. They are written to be read."
    >
      <div>
        <h2>Orders</h2>
        <p>
          An order is placed when you complete checkout, and confirmed once your payment clears and we email you. We may
          cancel an order, with a full refund, if something is wrong with it, for example a pricing error or an item we
          cannot supply.
        </p>
      </div>

      <div>
        <h2>Prices and payment</h2>
        <p>
          Prices are shown in {process.env.NEXT_PUBLIC_CURRENCY ?? 'USD'} and are charged when you check out. You can pay by
          Ecocash, OneMoney, or by Visa, Mastercard or another method through Paynow. Payments are processed by Paynow. If a
          payment is not completed within 45 minutes, the order is cancelled and the items go back on sale.
        </p>
      </div>

      <div>
        <h2>Stock and drops</h2>
        <p>
          We make small runs. Stock is held for you while your payment is pending and released if it is not completed.
          Drop items go on sale at the time shown and may sell out quickly. Product photos are as accurate as we can make
          them, but colours can look different on different screens.
        </p>
      </div>

      <div>
        <h2>Delivery</h2>
        <p>
          We confirm delivery arrangements, and any delivery cost, with you directly after you order, using the phone number
          and email you gave us. Please make sure they are correct. Delivery times are estimates, not guarantees.
        </p>
      </div>

      <div>
        <h2>Returns and exchanges</h2>
        <p>
          If something is not right, contact us within {SITE.returnDays} days of receiving your order. Items should be
          unworn, unwashed and in their original condition. If an item arrives faulty or is not what you ordered, we will
          replace it or refund you. Refunds go back by the method you paid with where we can, otherwise by agreement with you.
        </p>
      </div>

      <div>
        <h2>Your account</h2>
        <p>
          You do not need an account to buy. If you create one, keep your password to yourself. You are responsible for what
          happens under your account. We may close accounts that are used to abuse the shop.
        </p>
      </div>

      <div>
        <h2>Our responsibility</h2>
        <p>
          Nothing in these terms limits any right you have under law. Beyond that, we are not responsible for delays or
          losses outside our control, such as mobile network or payment provider outages.
        </p>
      </div>

      <div>
        <h2>Your information</h2>
        <p>
          See our <Link href="/privacy">privacy policy</Link> and <Link href="/cookies">cookie policy</Link>.
        </p>
      </div>

      <div>
        <h2>Law</h2>
        <p>These terms are governed by the laws of {SITE.country}. We may update them, and the date above will change when we do.</p>
      </div>
    </LegalPage>
  );
}
