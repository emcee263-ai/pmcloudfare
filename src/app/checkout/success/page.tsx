import type { Metadata } from 'next';
import Link from 'next/link';
import { ClearCartOnMount } from '@/components/checkout/ClearCartOnMount';

export const metadata: Metadata = { title: 'Order received', robots: { index: false } };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <section className="shell py-16 sm:py-24">
      <ClearCartOnMount />
      <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">Order received</h1>
      {order && (
        <p className="mt-6">
          <span className="text-mute">Order reference </span>
          <span className="font-semibold">{order.slice(0, 8)}</span>
        </p>
      )}
      <p className="mt-4 max-w-md text-mute">
        A receipt will be emailed to you once your payment is confirmed. You can follow the delivery from your
        account.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/account" className="btn">
          Track your order
        </Link>
        <Link href="/shop" className="btn-outline">
          Keep shopping
        </Link>
      </div>
    </section>
  );
}
