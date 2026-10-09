'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** While a payment is waiting, asks the server every few seconds and reloads the page once it settles. */
export function OrderStatusPoller({ orderId }: { orderId: string }) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    let tries = 0;

    async function check() {
      if (stopped) return;
      tries += 1;
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { status: string };
          if (data.status !== 'pending') {
            router.refresh();
            return;
          }
        }
      } catch {
        // Try again on the next tick.
      }
      if (tries < 100) timer = setTimeout(check, 4000);
    }

    let timer = setTimeout(check, 2500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId, router]);

  return null;
}
