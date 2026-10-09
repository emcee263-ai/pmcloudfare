import { isReservedEmail, isThrottled, recordAttempt } from '@/lib/auth';
import { runInBackground, siteOrigin } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { clientIp, fail, json, parseJson } from '@/lib/http';
import { createResetToken } from '@/lib/password-reset';
import { forgotSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = await parseJson(request, forgotSchema);
  if (!parsed.ok) return parsed.response;

  const email = parsed.data.email.toLowerCase();
  const ipKey = `forgot:ip:${clientIp(request)}`;
  const emailKey = `forgot:email:${email}`;
  if ((await isThrottled(ipKey, 10)) || (await isThrottled(emailKey, 3))) {
    return fail('Too many requests. Try again in a while.', 429);
  }
  await Promise.all([recordAttempt(ipKey, 3600), recordAttempt(emailKey, 3600)]);

  const origin = siteOrigin(request);

  // The same answer comes back whether or not the account exists, so this cannot be used to look up customers.
  // The owner's login is set by a secret, so it is not reset by email.
  if (!isReservedEmail(email)) {
    await runInBackground(
      (async () => {
        const db = await getDb();
        const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
        if (!user) return;
        const token = await createResetToken(user.id);
        const result = await sendPasswordResetEmail(email, `${origin}/reset-password?token=${token}`);
        if (!result.ok) console.error('Password reset email failed:', result.error);
      })(),
    );
  }

  return json({ ok: true });
}
