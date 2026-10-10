'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EMPTY_ADDRESS, PAYMENT_METHODS, type Address } from '@/lib/validation';
import { formatPrice } from '@/lib/utils';
import { cartTotals, useCartStore } from '@/store/cart';

type Method = (typeof PAYMENT_METHODS)[number]['value'];

export function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const clear = useCartStore((s) => s.clear);
  const totals = useMemo(() => cartTotals(items, coupon), [items, coupon]);

  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [method, setMethod] = useState<Method>('ecocash');
  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The bag is read from the browser after the page loads, so wait before saying it is empty.
  useEffect(() => setReady(true), []);

  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          paymentMethod: method,
          mobileNumber: method === 'paynow' ? undefined : mobile || address.phone,
          couponCode: coupon,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; redirectUrl?: string };
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? 'Something went wrong. Try again.');
        setBusy(false);
        return;
      }
      // The order now exists and holds its stock, so the bag has done its job.
      clear();
      window.location.assign(data.redirectUrl);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  if (!ready) return <div className="h-64" aria-hidden="true" />;

  if (items.length === 0) {
    return (
      <div className="max-w-md">
        <p className="text-mute">Your bag is empty.</p>
        <Link href="/shop" className="btn mt-6">Go to the shop</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-10">
        <fieldset className="space-y-5">
          <legend className="mb-2 font-display text-2xl font-bold">Delivery</legend>
          <Field label="Full name" id="full_name" value={address.full_name} onChange={set('full_name')} autoComplete="name" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" id="email" type="email" value={address.email} onChange={set('email')} autoComplete="email" />
            <Field label="Phone" id="phone" type="tel" value={address.phone} onChange={set('phone')} autoComplete="tel" />
          </div>
          <Field label="Street address" id="line1" value={address.line1} onChange={set('line1')} autoComplete="address-line1" />
          <Field label="Apartment, suite (optional)" id="line2" value={address.line2 ?? ''} onChange={set('line2')} autoComplete="address-line2" required={false} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City" id="city" value={address.city} onChange={set('city')} autoComplete="address-level2" />
            <Field label="Province or state" id="region" value={address.region} onChange={set('region')} autoComplete="address-level1" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Postal code (optional)" id="postal_code" value={address.postal_code ?? ''} onChange={set('postal_code')} autoComplete="postal-code" required={false} />
            <Field label="Country" id="country" value={address.country} onChange={set('country')} autoComplete="country-name" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 font-display text-2xl font-bold">Payment</legend>
          <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-3 gap-2 sm:gap-3">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value} className="block cursor-pointer">
                <input
                  type="radio"
                  name="method"
                  value={m.value}
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                  className="peer sr-only"
                />
                <span className="flex h-12 items-center justify-center border border-white/30 px-2 text-center text-sm transition-colors hover:border-white peer-checked:border-white peer-checked:bg-white peer-checked:font-semibold peer-checked:text-black peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
                  {m.short}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-mute">{PAYMENT_METHODS.find((m) => m.value === method)?.hint}</p>

          {method !== 'paynow' && (
            <div>
              <label htmlFor="mobile" className="field-label">
                {method === 'ecocash' ? 'Ecocash' : 'OneMoney'} number
              </label>
              <input
                id="mobile"
                inputMode="tel"
                placeholder="0771234567"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="field"
                required
              />
              <p className="mt-2 text-xs text-mute">
                We send a payment request to this number. Keep your phone close to approve it.
              </p>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="h-fit space-y-6 bg-surface p-6 md:sticky md:top-24">
        <h2 className="font-display text-2xl font-bold">Your order</h2>
        <ul className="space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-4">
              <span>
                {i.name} <span className="text-mute">{i.size} x {i.quantity}</span>
              </span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-white/15 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
          {totals.discount > 0 && (
            <div className="flex justify-between"><dt className="text-mute">Code {coupon}</dt><dd>-{formatPrice(totals.discount)}</dd></div>
          )}
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(totals.total)}</dd></div>
        </dl>

        {error && <p role="alert" className="text-sm">{error}</p>}

        <button type="submit" disabled={busy} className="btn w-full">
          {busy ? 'Starting payment...' : 'Place order'}
        </button>
      </aside>
    </form>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  autoComplete,
  required = true,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} autoComplete={autoComplete} required={required} className="field" />
    </div>
  );
}
