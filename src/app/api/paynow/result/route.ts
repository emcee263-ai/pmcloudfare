import { siteOrigin } from '@/lib/cloudflare';
import { refreshOrder } from '@/lib/payments';
import { getPaynowConfig, parseStatusUpdate } from '@/lib/paynow';

// Paynow posts here when a payment changes. The update is only used to find the order:
// the payment itself is confirmed by asking Paynow directly, so a forged post changes nothing.
export async function POST(request: Request) {
  const config = getPaynowConfig();
  if (!config) return new Response('Payments are not set up', { status: 503 });

  const update = await parseStatusUpdate(config, await request.text());
  if (!update || !update.reference) return new Response('Ignored', { status: 400 });

  await refreshOrder(update.reference, siteOrigin(request), { force: true });
  return new Response('OK');
}
