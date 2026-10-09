import { requireAdminApi } from '@/lib/auth';
import { siteOrigin } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { notifyOrderPaid } from '@/lib/email';
import { fail, isSameOrigin, json } from '@/lib/http';
import { getOrderRow } from '@/lib/orders';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;
  if (!isSameOrigin(request)) return fail('Request blocked.', 403);

  const { id } = await params;
  const row = await getOrderRow(await getDb(), id);
  if (!row) return fail('Order not found.', 404);
  if (row.status === 'pending' || row.status === 'cancelled') {
    return fail('Only paid orders get a confirmation email.', 409);
  }

  const result = await notifyOrderPaid(id, siteOrigin(request), { force: true });
  return result.ok ? json({ ok: true }) : fail(`The email could not be sent: ${result.error}`, 502);
}
