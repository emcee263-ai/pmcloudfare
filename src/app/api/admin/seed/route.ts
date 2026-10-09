import { insertProduct } from '@/lib/admin-products';
import { requireAdminApi } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { fail, isSameOrigin, json } from '@/lib/http';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

// Loads the sample catalogue into an empty shop so the storefront has something on it.
export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;
  if (!isSameOrigin(request)) return fail('Request blocked.', 403);

  const db = await getDb();
  const existing = await db.prepare('SELECT COUNT(*) AS count FROM products').first<{ count: number }>();
  if (existing && existing.count > 0) return fail('The shop already has products.', 409);

  for (const product of MOCK_PRODUCTS) {
    await insertProduct(db, {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      is_drop: product.is_drop,
      is_active: product.is_active,
      drop_at: product.drop_at ?? null,
      variants: product.product_variants.map((v) => ({
        size: v.size,
        color: v.color,
        stock_quantity: v.stock_quantity,
        sku: v.sku,
      })),
      images: product.product_images.map((image) => ({ image_url: image.image_url })),
    });
  }
  return json({ count: MOCK_PRODUCTS.length }, 201);
}
