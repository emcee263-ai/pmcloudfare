'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { ProductVariant } from '@/types';

/**
 * Keeps a product's variant stock current via Supabase Realtime.
 * Needs product_variants in the supabase_realtime publication (see supabase/extras.sql).
 */
export function useLiveStock(productId: string, initial: ProductVariant[]) {
  const [variants, setVariants] = useState(initial);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`stock:${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'product_variants',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          const next = payload.new as Partial<ProductVariant> & { id: string };
          setVariants((current) =>
            current.map((v) =>
              v.id === next.id && typeof next.stock_quantity === 'number'
                ? { ...v, stock_quantity: next.stock_quantity }
                : v,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return variants;
}
