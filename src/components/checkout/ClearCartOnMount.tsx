'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';

export function ClearCartOnMount() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useCartStore.getState().clear();
  }, []);
  return null;
}
