import type { D1Database, D1PreparedStatement } from '@/lib/cloudflare';
import { toCents } from '@/lib/utils';
import type { ProductInput } from '@/lib/validation';

type VariantInput = ProductInput['variants'][number];

/** The date picker gives a local time; store it as a full UTC timestamp. */
function dropAt(input: ProductInput) {
  if (!input.is_drop || !input.drop_at) return null;
  const date = new Date(input.drop_at);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function insertVariant(db: D1Database, productId: string, variant: VariantInput) {
  return db
    .prepare('INSERT INTO product_variants (id, product_id, size, color, stock_quantity, sku) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), productId, variant.size, variant.color, variant.stock_quantity, variant.sku || null);
}

function insertImages(db: D1Database, productId: string, images: ProductInput['images']) {
  return images.map((image, index) =>
    db
      .prepare('INSERT INTO product_images (id, product_id, image_url, display_order) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), productId, image.image_url, index),
  );
}

/** Creates a product with its sizes and images in one transaction. */
export async function insertProduct(db: D1Database, input: ProductInput): Promise<string> {
  const id = crypto.randomUUID();
  await db.batch([
    db
      .prepare(
        'INSERT INTO products (id, name, slug, description, price_cents, is_drop, drop_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        id,
        input.name,
        input.slug,
        input.description || null,
        toCents(input.price),
        input.is_drop ? 1 : 0,
        dropAt(input),
        input.is_active ? 1 : 0,
      ),
    ...input.variants.map((variant) => insertVariant(db, id, variant)),
    ...insertImages(db, id, input.images),
  ]);
  return id;
}

/**
 * Saves an edited product. Sizes the owner removed are deleted, new ones are added.
 * Returns false when the product does not exist.
 */
export async function updateProduct(db: D1Database, id: string, input: ProductInput): Promise<boolean> {
  const exists = await db.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (!exists) return false;

  const { results: current } = await db
    .prepare('SELECT id FROM product_variants WHERE product_id = ?')
    .bind(id)
    .all<{ id: string }>();
  const currentIds = new Set(current.map((v) => v.id));
  const keptIds = new Set(
    input.variants.map((v) => v.id).filter((variantId): variantId is string => Boolean(variantId && currentIds.has(variantId))),
  );

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        'UPDATE products SET name = ?, slug = ?, description = ?, price_cents = ?, is_drop = ?, drop_at = ?, is_active = ? WHERE id = ?',
      )
      .bind(
        input.name,
        input.slug,
        input.description || null,
        toCents(input.price),
        input.is_drop ? 1 : 0,
        dropAt(input),
        input.is_active ? 1 : 0,
        id,
      ),
    // Removals first, so a size can be deleted and re-added in the same save.
    ...current
      .filter((v) => !keptIds.has(v.id))
      .map((v) => db.prepare('DELETE FROM product_variants WHERE id = ?').bind(v.id)),
  ];

  for (const variant of input.variants) {
    if (variant.id && keptIds.has(variant.id)) {
      if (variant.stock_before !== undefined) {
        // Add what the owner added or took away. A sale made while the form was open stays counted.
        statements.push(
          db
            .prepare(
              'UPDATE product_variants SET size = ?, color = ?, sku = ?, stock_quantity = stock_quantity + ? WHERE id = ? AND product_id = ?',
            )
            .bind(
              variant.size,
              variant.color,
              variant.sku || null,
              variant.stock_quantity - variant.stock_before,
              variant.id,
              id,
            ),
        );
      } else {
        statements.push(
          db
            .prepare(
              'UPDATE product_variants SET size = ?, color = ?, sku = ?, stock_quantity = ? WHERE id = ? AND product_id = ?',
            )
            .bind(variant.size, variant.color, variant.sku || null, variant.stock_quantity, variant.id, id),
        );
      }
    } else {
      statements.push(insertVariant(db, id, variant));
    }
  }

  statements.push(db.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id));
  statements.push(...insertImages(db, id, input.images));

  await db.batch(statements);
  return true;
}

/** Deletes a product. Past orders keep their own copy of the name, size and price. */
export async function deleteProduct(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return result.meta.changes === 1;
}

/** Turns a database error from saving a product into something the owner can act on. */
export function describeProductError(error: unknown): { message: string; status: number } | null {
  const text = error instanceof Error ? error.message : String(error);
  if (/UNIQUE constraint failed: products\.slug/i.test(text)) {
    return { message: 'Another product already uses that web address.', status: 409 };
  }
  if (/UNIQUE constraint failed: product_variants\.sku/i.test(text)) {
    return { message: 'That SKU is already used by another size.', status: 409 };
  }
  if (/UNIQUE constraint failed: product_variants\./i.test(text)) {
    return { message: 'Each size and colour combination can only be listed once.', status: 409 };
  }
  if (/CHECK constraint failed/i.test(text)) {
    return {
      message: 'That change would take a size below zero stock. A customer may have just bought it. Reload and try again.',
      status: 409,
    };
  }
  return null;
}
