import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getVar } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { fail } from '@/lib/http';
import type { User } from '@/types';

const COOKIE = 'pm_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;
// Cloudflare Workers caps PBKDF2 at 100,000 iterations.
const ITERATIONS = 100_000;

const encoder = new TextEncoder();

// ---------- encoding helpers ----------

function toBase64(bytes: Uint8Array) {
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function fromBase64(value: string) {
  const text = atob(value);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}

function toBase64Url(bytes: Uint8Array) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHex(new Uint8Array(digest));
}

// ---------- passwords ----------

async function derive(password: string, saltBytes: Uint8Array, iterations: number) {
  // Copy into a fresh buffer. Newer TypeScript only accepts bytes backed by a plain ArrayBuffer here.
  const salt = new Uint8Array(saltBytes.length);
  salt.set(saltBytes);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iterations || !salt || !hash) return false;
  const count = Number(iterations);
  if (!Number.isInteger(count) || count < 1 || count > ITERATIONS) return false;
  const actual = await derive(password, fromBase64(salt), count);
  return safeEqual(actual, fromBase64(hash));
}

/** Compares a secret without leaking how much of it matched. */
async function secretEquals(a: string, b: string) {
  const [x, y] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  return safeEqual(new Uint8Array(x), new Uint8Array(y));
}

// ---------- the owner's login ----------

/** The store owner signs in with ADMIN_EMAIL and the ADMIN_PASSWORD secret. */
export function adminCredentials() {
  const email = getVar('ADMIN_EMAIL');
  const password = getVar('ADMIN_PASSWORD');
  return email && password ? { email: email.toLowerCase(), password } : null;
}

export function isReservedEmail(email: string) {
  const admin = getVar('ADMIN_EMAIL');
  return Boolean(admin && admin.toLowerCase() === email.trim().toLowerCase());
}

/** Checks an email and password. Returns the user, or null when they do not match. */
export async function authenticate(emailInput: string, password: string): Promise<User | null> {
  const db = await getDb();
  const email = emailInput.trim().toLowerCase();
  const admin = adminCredentials();

  if (admin && email === admin.email) {
    if (!(await secretEquals(password, admin.password))) return null;

    const existing = await db
      .prepare('SELECT id, email, full_name, role FROM users WHERE email = ?')
      .bind(email)
      .first<User>();

    if (!existing) {
      const id = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO users (id, email, full_name, password_hash, role) VALUES (?, ?, 'Store admin', 'external', 'admin')",
        )
        .bind(id, email)
        .run();
      return { id, email, full_name: 'Store admin', role: 'admin' };
    }
    if (existing.role !== 'admin') {
      await db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(existing.id).run();
      return { ...existing, role: 'admin' };
    }
    return existing;
  }

  const row = await db
    .prepare('SELECT id, email, full_name, role, password_hash FROM users WHERE email = ?')
    .bind(email)
    .first<User & { password_hash: string }>();

  if (!row) {
    // Spend about the same time as a real check so timing does not reveal which emails exist.
    await derive(password, new Uint8Array(16), ITERATIONS);
    return null;
  }
  if (!(await verifyPassword(password, row.password_hash))) return null;
  return { id: row.id, email: row.email, full_name: row.full_name, role: row.role };
}

// ---------- sign-in attempts ----------

export async function isThrottled(key: string, limit: number) {
  const db = await getDb();
  const row = await db
    .prepare('SELECT attempts, reset_at FROM auth_throttle WHERE key = ?')
    .bind(key)
    .first<{ attempts: number; reset_at: number }>();
  const now = Math.floor(Date.now() / 1000);
  return Boolean(row && row.reset_at > now && row.attempts >= limit);
}

export async function recordAttempt(key: string, windowSeconds = 900) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO auth_throttle (key, attempts, reset_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         attempts = CASE WHEN reset_at > ? THEN attempts + 1 ELSE 1 END,
         reset_at = CASE WHEN reset_at > ? THEN reset_at ELSE ? END`,
    )
    .bind(key, now + windowSeconds, now, now, now + windowSeconds)
    .run();
}

export async function clearAttempts(key: string) {
  const db = await getDb();
  await db.prepare('DELETE FROM auth_throttle WHERE key = ?').bind(key).run();
}

// ---------- sessions ----------

export async function createSession(userId: string) {
  const db = await getDb();
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const now = Math.floor(Date.now() / 1000);

  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    db
      .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(await sha256Hex(token), userId, now + SESSION_SECONDS),
  ]);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256Hex(token)).run();
  }
  jar.delete(COOKIE);
}

/** The signed-in user for this request, or null. Cached so a page and its layout share one lookup. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const user = await db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .bind(await sha256Hex(token), Math.floor(Date.now() / 1000))
    .first<User>();
  return user ?? null;
});

// ---------- guards ----------

/** For pages: send signed-out visitors to the sign-in page. */
export async function requireUser(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * For admin pages: only the owner gets in. Anyone else, signed in or not, sees the ordinary "page not found"
 * page, so customers are never sent to a sign-in screen or told that an admin area exists.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') notFound();
  return user;
}

/** For admin API routes. Every admin route must call this itself. */
export async function requireAdminApi(): Promise<{ ok: true; user: User } | { ok: false; response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: fail('Sign in to continue.', 401) };
  if (user.role !== 'admin') return { ok: false, response: fail('You do not have access to this.', 403) };
  return { ok: true, user };
}
