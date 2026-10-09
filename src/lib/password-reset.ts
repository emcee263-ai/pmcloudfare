import { hashPassword, sha256Hex } from '@/lib/auth';
import { getDb } from '@/lib/db';

const LIFETIME_SECONDS = 60 * 60;

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Makes a one-hour, single-use token for a customer account. Only its hash is stored. */
export async function createResetToken(userId: string) {
  const db = await getDb();
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at < ?').bind(userId, now),
    db
      .prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(await sha256Hex(token), userId, now + LIFETIME_SECONDS),
  ]);
  return token;
}

/** Sets a new password if the token is valid and unused. Signs the account out everywhere. */
export async function redeemResetToken(token: string, password: string): Promise<boolean> {
  const db = await getDb();
  const hash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);

  const claim = await db
    .prepare('UPDATE password_resets SET used = 1 WHERE token_hash = ? AND used = 0 AND expires_at > ?')
    .bind(hash, now)
    .run();
  if (claim.meta.changes !== 1) return false;

  const row = await db
    .prepare('SELECT user_id FROM password_resets WHERE token_hash = ?')
    .bind(hash)
    .first<{ user_id: string }>();
  if (!row) return false;

  await db.batch([
    db
      .prepare("UPDATE users SET password_hash = ? WHERE id = ? AND password_hash != 'external'")
      .bind(await hashPassword(password), row.user_id),
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(row.user_id),
    db.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(row.user_id),
  ]);
  return true;
}
