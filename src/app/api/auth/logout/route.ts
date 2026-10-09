import { destroySession } from '@/lib/auth';
import { fail, isSameOrigin, json } from '@/lib/http';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail('Request blocked.', 403);
  await destroySession();
  return json({ ok: true });
}
