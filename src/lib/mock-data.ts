import type { Product, ProductVariant } from '@/types';

// Sample catalog. The admin dashboard can load these into an empty database
// so you can see the storefront before adding real products.

function variants(productId: string, stock: Record<string, number>): ProductVariant[] {
  return Object.entries(stock).map(([size, quantity]) => ({
    id: `${productId}-${size.toLowerCase().replace(/\s+/g, '-')}`,
    product_id: productId,
    size,
    color: 'Black',
    stock_quantity: quantity,
    sku: `PMG-${productId.toUpperCase()}-${size.replace(/\s+/g, '')}`,
  }));
}

const NOW = '2026-10-01T00:00:00Z';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'hoodie',
    name: 'PEACEMAGENTS Hoodie',
    slug: 'peacemagents-hoodie',
    description: 'Heavyweight fleece in a boxy cut with dropped shoulders. Logo embroidered on the chest.',
    price: 95,
    is_drop: true,
    is_active: true,
    drop_at: '2026-10-31T16:00:00Z',
    created_at: NOW,
    product_variants: variants('hoodie', { S: 8, M: 14, L: 3, XL: 10, XXL: 0 }),
    product_images: [],
  },
  {
    id: 'tee',
    name: 'Minimal Boxy Tee',
    slug: 'minimal-boxy-tee',
    description: 'Midweight cotton jersey, boxy fit, clean neckline. No front print.',
    price: 45,
    is_drop: false,
    is_active: true,
    created_at: NOW,
    product_variants: variants('tee', { S: 20, M: 25, L: 18, XL: 12, XXL: 6 }),
    product_images: [],
  },
  {
    id: 'cap',
    name: 'PEACEMAGENTS Cap',
    slug: 'peacemagents-cap',
    description: 'Six-panel cotton twill cap with an unstructured crown and adjustable strap.',
    price: 30,
    is_drop: false,
    is_active: true,
    created_at: NOW,
    product_variants: variants('cap', { 'One size': 40 }),
    product_images: [],
  },
  {
    id: 'cargo',
    name: 'Cargo Trouser',
    slug: 'cargo-trouser',
    description: 'Relaxed straight leg in ripstop cotton with two deep cargo pockets.',
    price: 85,
    is_drop: false,
    is_active: true,
    created_at: NOW,
    product_variants: variants('cargo', { S: 5, M: 9, L: 9, XL: 4, XXL: 2 }),
    product_images: [],
  },
  {
    id: 'zip',
    name: 'Zip Hoodie',
    slug: 'zip-hoodie',
    description: 'The drop hoodie with a full metal zip and a kangaroo pocket.',
    price: 110,
    is_drop: true,
    is_active: true,
    drop_at: '2026-10-31T16:00:00Z',
    created_at: NOW,
    product_variants: variants('zip', { S: 6, M: 6, L: 2, XL: 0, XXL: 0 }),
    product_images: [],
  },
  {
    id: 'longsleeve',
    name: 'Long Sleeve Tee',
    slug: 'long-sleeve-tee',
    description: 'The boxy tee with a full-length sleeve and a ribbed cuff.',
    price: 55,
    is_drop: false,
    is_active: true,
    created_at: NOW,
    product_variants: variants('longsleeve', { S: 10, M: 14, L: 11, XL: 7, XXL: 3 }),
    product_images: [],
  },
];
