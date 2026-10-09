import { createSession, hashPassword, isReservedEmail, isThrottled, recordAttempt } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { clientIp, fail, json, parseJson } from '@/lib/http';
import { signupSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = await parseJson(request, signupSchema);
  if (!parsed.ok) return parsed.response;

  const email = parsed.data.email.toLowerCase();
  const throttleKey = `signup:${clientIp(request)}`;
  if (await isThrottled(throttleKey, 10)) {
    return fail('Too many attempts. Wait a few minutes and try again.', 429);
  }
  await recordAttempt(throttleKey, 900);

  // The owner's address is reserved for the owner's login, so nobody can sign up as it first.
  if (isReservedEmail(email)) {
    return fail('An account with that email already exists. Try signing in.', 409);
  }

  const db = await getDb();
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return fail('An account with that email already exists. Try signing in.', 409);

  const id = crypto.randomUUID();
  try {
    await db
      .prepare("INSERT INTO users (id, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, 'customer')")
      .bind(id, email, parsed.data.full_name, await hashPassword(parsed.data.password))
      .run();
  } catch (error) {
    if (/UNIQUE constraint failed: users\.email/i.test(error instanceof Error ? error.message : String(error))) {
      return fail('An account with that email already exists. Try signing in.', 409);
    }
    throw error;
  }

  await createSession(id);
  return json({ ok: true, role: 'customer' }, 201);
}
