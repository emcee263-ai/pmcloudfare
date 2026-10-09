import { requireAdminApi } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { fail, json, parseJson } from '@/lib/http';
import { setOrderStatus } from '@/lib/orders';
import { orderStatusSchema } from '@/lib/validation';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const parsed = await parseJson(request, orderStatusSchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const result = await setOrderStatus(await getDb(), id, parsed.data.status);
  return result.ok ? json({ ok: true }) : fail(result.error, result.code);
}
