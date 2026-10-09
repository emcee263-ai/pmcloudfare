import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="shell py-10 sm:py-16">
      <h1 className="mb-10 font-display text-5xl font-extrabold tracking-tight sm:text-7xl">Checkout</h1>
      <CheckoutForm />
    </section>
  );
}
