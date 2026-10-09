import { describeProductError, insertProduct } from '@/lib/admin-products';
import { requireAdminApi } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { fail, json, parseJson } from '@/lib/http';
import { productInputSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const parsed = await parseJson(request, productInputSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const id = await insertProduct(await getDb(), parsed.data);
    return json({ id }, 201);
  } catch (error) {
    const known = describeProductError(error);
    if (known) return fail(known.message, known.status);
    throw error;
  }
}
