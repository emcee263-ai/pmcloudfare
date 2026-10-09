'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Silhouette } from '@/components/ui/Silhouette';
import { cn, formatPrice, getKind } from '@/lib/utils';
import { cartTotals, useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';

export function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen);
  const close = useUIStore((s) => s.closeCart);

  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const totals = useMemo(() => cartTotals(items, coupon), [items, coupon]);
  const [code, setCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  function onApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    if (applyCoupon(code)) {
      setCode('');
      setCouponError(null);
    } else {
      setCouponError('That code is not valid.');
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          'fixed inset-0 z-50 bg-black/70 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        inert={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <h2 className="font-display text-xl font-bold">Cart ({totals.count})</h2>
          <button ref={closeButton} type="button" onClick={close} className="text-sm text-mute hover:text-white">
            close
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-4 px-5">
            <p className="text-mute">Your cart is empty.</p>
            <Link href="/shop" onClick={close} className="btn">
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-white/10 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-5">
                  <div className="relative h-24 w-20 shrink-0 bg-surface-raised">
                    {item.image ? (
                      <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <Silhouette kind={getKind(item.name)} className="absolute inset-0 m-auto w-12 text-mute/70" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between text-sm">
                    <div>
                      <Link href={`/product/${item.slug}`} onClick={close} className="font-medium hover:underline">
                        {item.name}
                      </Link>
                      <p className="text-mute">
                        {item.size}, {item.color}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-white/25" role="group" aria-label={`Quantity for ${item.name}`}>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="h-8 w-8"
                          onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                        >
                          &minus;
                        </button>
                        <span className="w-6 text-center tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="h-8 w-8 disabled:text-mute"
                          disabled={item.quantity >= item.maxStock}
                          onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p>{formatPrice(item.price * item.quantity)}</p>
                        <button
                          type="button"
                          className="text-xs text-mute hover:text-white"
                          onClick={() => removeItem(item.variantId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 space-y-4 bg-surface-raised p-5">
              {coupon ? (
                <p className="flex items-center justify-between text-sm">
                  <span>Code {coupon} applied</span>
                  <button type="button" className="text-mute hover:text-white" onClick={removeCoupon}>
                    Remove
                  </button>
                </p>
              ) : (
                <form onSubmit={onApplyCoupon} className="flex gap-2">
                  <label htmlFor="coupon" className="sr-only">
                    Discount code
                  </label>
                  <input
                    id="coupon"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Discount code"
                    autoComplete="off"
                    className="field h-11 bg-surface"
                    aria-describedby={couponError ? 'coupon-error' : undefined}
                  />
                  <button type="submit" className="btn-outline h-11 shrink-0 px-4">
                    Apply
                  </button>
                </form>
              )}
              {couponError && (
                <p id="coupon-error" role="alert" className="text-sm text-white">
                  {couponError}
                </p>
              )}

              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-mute">Subtotal</dt>
                  <dd>{formatPrice(totals.subtotal)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-mute">Discount</dt>
                    <dd>&minus;{formatPrice(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatPrice(totals.total)}</dd>
                </div>
              </dl>
              <p className="text-xs text-mute">Shipping is calculated at checkout.</p>

              <Link href="/checkout" onClick={close} className="btn w-full">
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
