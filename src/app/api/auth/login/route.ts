import { authenticate, clearAttempts, createSession, isThrottled, recordAttempt } from '@/lib/auth';
import { clientIp, fail, json, parseJson } from '@/lib/http';
import { loginSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = await parseJson(request, loginSchema);
  if (!parsed.ok) return parsed.response;

  const email = parsed.data.email.toLowerCase();
  const ipKey = `login:ip:${clientIp(request)}`;
  const emailKey = `login:email:${email}`;

  if ((await isThrottled(ipKey, 30)) || (await isThrottled(emailKey, 8))) {
    return fail('Too many attempts. Wait 15 minutes and try again.', 429);
  }

  const user = await authenticate(email, parsed.data.password);
  if (!user) {
    await Promise.all([recordAttempt(ipKey), recordAttempt(emailKey)]);
    return fail('That email and password do not match.', 401);
  }

  await clearAttempts(emailKey);
  await createSession(user.id);
  return json({ ok: true, role: user.role });
}
