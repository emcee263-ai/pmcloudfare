import { deleteProduct, describeProductError, updateProduct } from '@/lib/admin-products';
import { requireAdminApi } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { fail, isSameOrigin, json, parseJson } from '@/lib/http';
import { productInputSchema } from '@/lib/validation';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const parsed = await parseJson(request, productInputSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  try {
    const found = await updateProduct(await getDb(), id, parsed.data);
    return found ? json({ ok: true }) : fail('Product not found.', 404);
  } catch (error) {
    const known = describeProductError(error);
    if (known) return fail(known.message, known.status);
    throw error;
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;
  if (!isSameOrigin(request)) return fail('Request blocked.', 403);

  const { id } = await params;
  const found = await deleteProduct(await getDb(), id);
  return found ? json({ ok: true }) : fail('Product not found.', 404);
}
