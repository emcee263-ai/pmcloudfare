import { isThrottled, recordAttempt } from '@/lib/auth';
import { clientIp, fail, json, parseJson } from '@/lib/http';
import { redeemResetToken } from '@/lib/password-reset';
import { resetSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = await parseJson(request, resetSchema);
  if (!parsed.ok) return parsed.response;

  const ipKey = `reset:ip:${clientIp(request)}`;
  if (await isThrottled(ipKey, 10)) return fail('Too many attempts. Try again in a while.', 429);
  await recordAttempt(ipKey, 900);

  const ok = await redeemResetToken(parsed.data.token, parsed.data.password);
  if (!ok) return fail('This link has expired or was already used. Ask for a new one.', 400);
  return json({ ok: true });
}
