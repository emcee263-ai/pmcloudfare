import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { sortVariants } from '@/lib/utils';
import type { Product } from '@/types';

const SELECT = '*, product_variants(*), product_images(*)';

function normalise(p: Product): Product {
  return {
    ...p,
    price: Number(p.price),
    product_variants: sortVariants(p.product_variants ?? []),
    product_images: [...(p.product_images ?? [])].sort((a, b) => a.display_order - b.display_order),
  };
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return MOCK_PRODUCTS;

  const { data, error } = await createPublicClient()
    .from('products')
    .select(SELECT)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('getProducts failed:', error?.message);
    return [];
  }
  return (data as unknown as Product[]).map(normalise);
}

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  if (!isSupabaseConfigured) return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;

  const { data, error } = await createPublicClient()
    .from('products')
    .select(SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return normalise(data as unknown as Product);
});
