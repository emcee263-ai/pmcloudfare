import clsx, { type ClassValue } from 'clsx';
import type { Product, ProductKind, ProductVariant } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? 'USD';

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY }).format(amount);
}

export function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** The schema has no category column, so the garment type is read from the name. */
export function getKind(name: string): ProductKind {
  const n = name.toLowerCase();
  if (/\b(cap|beanie|hat)\b/.test(n)) return 'cap';
  if (/\b(trouser|trousers|pant|pants|short|shorts|cargo)\b/.test(n)) return 'bottom';
  if (/\b(hoodie|crew|crewneck|zip)\b/.test(n)) return 'hoodie';
  return 'tee';
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One size'];

export function sortVariants(variants: ProductVariant[]) {
  const rank = (size: string) => {
    const i = SIZE_ORDER.indexOf(size);
    return i === -1 ? SIZE_ORDER.length : i;
  };
  return [...variants].sort((a, b) => rank(a.size) - rank(b.size));
}

export function totalStock(product: Product) {
  return product.product_variants.reduce((n, v) => n + Math.max(0, v.stock_quantity), 0);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
