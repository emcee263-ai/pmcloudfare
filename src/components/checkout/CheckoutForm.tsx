'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cartTotals, useCartStore } from '@/store/cart';
import { checkoutSchema, EMPTY_ADDRESS, PAYMENT_METHODS, type Address } from '@/lib/validation';
import { cn, formatPrice } from '@/lib/utils';

type FieldKey = keyof Address;

const FIELDS: { name: FieldKey; label: string; type?: string; autoComplete: string; wide?: boolean }[] = [
  { name: 'full_name', label: 'Full name', autoComplete: 'name', wide: true },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
  { name: 'line1', label: 'Address', autoComplete: 'address-line1', wide: true },
  { name: 'line2', label: 'Apartment, suite, etc. (optional)', autoComplete: 'address-line2', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'region', label: 'Province or state', autoComplete: 'address-level1' },
  { name: 'postal_code', label: 'Postal code (optional)', autoComplete: 'postal-code' },
  { name: 'country', label: 'Country', autoComplete: 'country-name' },
];

export function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const totals = useMemo(() => cartTotals(items, coupon), [items, coupon]);

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ecocash' | 'paynow'>('card');
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-md">
        <p className="text-mute">Your cart is empty, so there is nothing to check out.</p>
        <Link href="/shop" className="btn mt-6">
          Browse the shop
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const parsed = checkoutSchema.safeParse({
      address,
      paymentMethod,
      couponCode: coupon,
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    });

    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'address' && typeof issue.path[1] === 'string') {
          next[issue.path[1] as FieldKey] ??= issue.message;
        }
      }
      setErrors(next);
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`field-${first}`)?.focus();
      else setServerError('Something is wrong with your cart. Remove the items and add them again.');
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed. Try again.');
      window.location.assign(data.redirectUrl);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Checkout failed. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-10">
        <fieldset>
          <legend className="mb-5 font-display text-2xl font-bold">Delivery</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.name} className={f.wide ? 'sm:col-span-2' : undefined}>
                <label htmlFor={`field-${f.name}`} className="field-label">
                  {f.label}
                </label>
                <input
                  id={`field-${f.name}`}
                  name={f.name}
                  type={f.type ?? 'text'}
                  autoComplete={f.autoComplete}
                  value={address[f.name] ?? ''}
                  onChange={(e) => setAddress((a) => ({ ...a, [f.name]: e.target.value }))}
                  aria-invalid={errors[f.name] ? true : undefined}
                  aria-describedby={errors[f.name] ? `error-${f.name}` : undefined}
                  className={cn('field', errors[f.name] && 'border-white')}
                />
                {errors[f.name] && (
                  <p id={`error-${f.name}`} className="mt-2 text-sm text-white">
                    {errors[f.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-5 font-display text-2xl font-bold">Payment</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PAYMENT_METHODS.map((m) => (
              <label key={m.value}>
                <input
                  type="radio"
                  name="payment"
                  value={m.value}
                  className="peer sr-only"
                  checked={paymentMethod === m.value}
                  onChange={() => setPaymentMethod(m.value)}
                />
                <span className="flex h-12 cursor-pointer items-center justify-center border border-white/25 text-sm transition-colors hover:border-white peer-checked:border-white peer-checked:bg-white peer-checked:text-black peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
                  {m.label}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm text-mute">You pay on the next step with the method you pick.</p>
        </fieldset>
      </div>

      <aside className="h-fit bg-surface p-6 lg:sticky lg:top-24" aria-label="Order summary">
        <h2 className="font-display text-2xl font-bold">Your order</h2>
        <ul className="mt-5 divide-y divide-white/10">
          {items.map((item) => (
            <li key={item.variantId} className="flex justify-between gap-4 py-3 text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-mute">
                  {item.size}, {item.color}, qty {item.quantity}
                </p>
              </div>
              <p>{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-mute">Subtotal</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-mute">Discount ({coupon})</dt>
              <dd>&minus;{formatPrice(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-2 text-lg font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>

        {serverError && (
          <p role="alert" className="mt-5 bg-surface-raised p-3 text-sm">
            {serverError}
          </p>
        )}

        <button type="submit" className="btn mt-6 w-full" disabled={submitting}>
          {submitting ? 'Placing order' : 'Place order'}
        </button>
      </aside>
    </form>
  );
}
