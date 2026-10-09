import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="shell py-10 sm:py-16">
      <h1 className="mb-10 page-title font-display font-extrabold tracking-tight">Checkout</h1>
      <CheckoutForm />
    </section>
  );
}
