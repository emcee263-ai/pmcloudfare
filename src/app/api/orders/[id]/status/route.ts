import { siteOrigin } from '@/lib/cloudflare';
import { fail, json } from '@/lib/http';
import { refreshOrder } from '@/lib/payments';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The order page asks this every few seconds while a payment is waiting.
// The order id is a random UUID, so only whoever received the link can ask about it.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return fail('Order not found.', 404);

  const row = await refreshOrder(id, siteOrigin(request));
  if (!row) return fail('Order not found.', 404);

  return json({ status: row.status, paymentStatus: row.payment_status });
}
