'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';

/** Restores the saved cart from localStorage after mount (see skipHydration in the store). */
export function StoreHydrator() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);
  return null;
}
