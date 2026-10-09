import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/ui/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers about paying, delivery, returns, sizing and drops at PEACEMAGENTS.',
};

const FAQ: { group: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    group: 'Ordering and payment',
    items: [
      {
        q: 'How can I pay?',
        a: 'By Ecocash or OneMoney, or by Visa, Mastercard or another method on Paynow\'s secure page. Pick one at checkout.',
      },
      {
        q: 'How does Ecocash or OneMoney checkout work?',
        a: 'Enter your mobile money number at checkout. Paynow sends a payment request to your phone. Enter your PIN to approve it. The order page updates by itself and we email your confirmation.',
      },
      {
        q: 'Is it safe to pay by card?',
        a: 'Yes. You enter your card details on Paynow\'s page, not on ours, so we never see or store them.',
      },
      {
        q: 'I never got the payment prompt on my phone.',
        a: 'Check the number is the one registered for that wallet and that you have enough balance, then try again. If it keeps failing, pay by card instead or message us on WhatsApp.',
      },
      {
        q: 'I paid but I have no confirmation email.',
        a: <>Check your spam or junk folder first. If it is not there, open your order page, or message us on WhatsApp with your name and we will resend it.</>,
      },
      {
        q: 'Do I need an account?',
        a: 'No. You can check out as a guest. An account just lets you see your past orders in one place.',
      },
      {
        q: 'Can I use a discount code?',
        a: 'Yes. Add the code in your bag before you check out.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Message us as soon as you can. If it has not shipped yet we will cancel it and refund you.',
      },
    ],
  },
  {
    group: 'Delivery',
    items: [
      {
        q: 'Where do you deliver and how long does it take?',
        a: 'We confirm delivery arrangements, cost and timing with you directly after you order, so please check your phone number and email are right.',
      },
      {
        q: 'How do I track my order?',
        a: <>Open the order page from your confirmation email, or sign in and go to <Link href="/account" className="underline">your account</Link>. It shows Placed, Paid, Shipped and Delivered.</>,
      },
    ],
  },
  {
    group: 'Sizing, stock and drops',
    items: [
      {
        q: 'What size should I get?',
        a: 'Each product page has a size guide. Our pieces are cut boxy and relaxed. If you are between sizes or unsure, message us with your height and usual size and we will help.',
      },
      {
        q: 'What is a drop?',
        a: 'A drop is a limited release that goes on sale at a set time, with a countdown on the site. When a drop sells out, it is gone.',
      },
      {
        q: 'Will sold out items come back?',
        a: 'Sometimes, in a later run. Follow us on Instagram or message us and we will tell you.',
      },
    ],
  },
  {
    group: 'Returns',
    items: [
      {
        q: 'What is your returns policy?',
        a: `Contact us within ${SITE.returnDays} days of receiving your order. Items should be unworn and unwashed. Faulty or wrong items are replaced or refunded.`,
      },
    ],
  },
  {
    group: 'Your data',
    items: [
      {
        q: 'What do you do with my information?',
        a: <>Only what is needed to take payment and deliver your order. Read the <Link href="/privacy" className="underline">privacy policy</Link> and <Link href="/cookies" className="underline">cookie policy</Link>.</>,
      },
      {
        q: 'How do I delete my account or data?',
        a: <>Message us on any of the <Link href="/contact" className="underline">contact options</Link> and we will do it.</>,
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <LegalPage title="FAQ" showDate={false}>
      {FAQ.map((section) => (
        <div key={section.group}>
          <h2>{section.group}</h2>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {section.items.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                  {item.q}
                  <span aria-hidden="true" className="text-mute transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      ))}

      <p className="xl:col-span-2">
        Still stuck? <Link href="/contact">Contact us</Link>.
      </p>
    </LegalPage>
  );
}
