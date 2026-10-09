import { cache } from 'react';
import type { D1Database } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { fromCents, sortVariants } from '@/lib/utils';
import type { Product, ProductImage, ProductVariant } from '@/types';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  is_drop: number;
  drop_at: string | null;
  is_active: number;
  created_at: string;
}

function group<T extends { product_id: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.product_id);
    if (list) list.push(row);
    else map.set(row.product_id, [row]);
  }
  return map;
}

function mapProduct(row: ProductRow, variants: ProductVariant[], images: ProductImage[]): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: fromCents(row.price_cents),
    is_drop: row.is_drop === 1,
    is_active: row.is_active === 1,
    drop_at: row.drop_at,
    created_at: row.created_at,
    product_variants: sortVariants(variants),
    product_images: images,
  };
}

/** All products with their sizes and images. Hidden products are left out unless asked for. */
export async function getProducts(options: { includeInactive?: boolean } = {}): Promise<Product[]> {
  const db = await getDb();
  const only = options.includeInactive ? '' : 'WHERE p.is_active = 1';

  const [products, variants, images] = await db.batch<unknown>([
    db.prepare(`SELECT p.* FROM products p ${only} ORDER BY p.created_at DESC`),
    db.prepare(
      `SELECT v.* FROM product_variants v JOIN products p ON p.id = v.product_id ${only}`,
    ),
    db.prepare(
      `SELECT i.* FROM product_images i JOIN products p ON p.id = i.product_id ${only} ORDER BY i.display_order`,
    ),
  ]);

  const variantsByProduct = group(variants.results as ProductVariant[]);
  const imagesByProduct = group(images.results as ProductImage[]);

  return (products.results as ProductRow[]).map((row) =>
    mapProduct(row, variantsByProduct.get(row.id) ?? [], imagesByProduct.get(row.id) ?? []),
  );
}

async function loadOne(db: D1Database, row: ProductRow): Promise<Product> {
  const [variants, images] = await db.batch<unknown>([
    db.prepare('SELECT * FROM product_variants WHERE product_id = ?').bind(row.id),
    db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order').bind(row.id),
  ]);
  return mapProduct(row, variants.results as ProductVariant[], images.results as ProductImage[]);
}

/** A visible product by its web address. Shared between generateMetadata and the page. */
export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const db = await getDb();
  const row = await db
    .prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1')
    .bind(slug)
    .first<ProductRow>();
  return row ? loadOne(db, row) : null;
});

/** Any product by id, including hidden ones. For the admin. */
export async function getProductById(id: string): Promise<Product | null> {
  const db = await getDb();
  const row = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<ProductRow>();
  return row ? loadOne(db, row) : null;
}

export interface LowStockItem {
  product_name: string;
  size: string;
  color: string;
  stock_quantity: number;
}

export async function getLowStock(threshold = 5): Promise<LowStockItem[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT p.name AS product_name, v.size, v.color, v.stock_quantity
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE p.is_active = 1 AND v.stock_quantity <= ?
       ORDER BY v.stock_quantity ASC, p.name ASC LIMIT 12`,
    )
    .bind(threshold)
    .all<LowStockItem>();
  return results;
}
