import { getCloudflareContext } from '@opennextjs/cloudflare';
import { headers } from 'next/headers';

// Minimal shapes for the Cloudflare bindings this app uses. They are declared here
// so the project type-checks without generating Worker types first.

export interface D1Meta {
  changes?: number;
  last_row_id?: number;
  [key: string]: unknown;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: D1Meta;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: string | EmailAddress | (string | EmailAddress)[];
  from: string | EmailAddress;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | EmailAddress;
}

export interface EmailBinding {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}

export interface AppEnv {
  DB?: D1Database;
  EMAIL?: EmailBinding;
  [key: string]: unknown;
}

/** Bindings, variables and secrets for the current request. */
export function getEnv(): AppEnv {
  return getCloudflareContext().env as unknown as AppEnv;
}

/** Reads a text variable or secret by name. Returns undefined when it is missing or empty. */
export function getVar(name: string): string | undefined {
  const fromEnv = getEnv()[name];
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim();
  const fromProcess = process.env[name];
  return fromProcess && fromProcess.trim() ? fromProcess.trim() : undefined;
}

/** The address the current page was requested on. For server components, which have no Request. */
export async function requestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && !configured.includes('localhost')) return configured.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return (configured ?? 'http://localhost:3000').replace(/\/$/, '');
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** The public address of the site, used in emails and Paynow return links. */
export function siteOrigin(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && !configured.includes('localhost')) return configured.replace(/\/$/, '');
  if (request) return new URL(request.url).origin;
  return (configured ?? 'http://localhost:3000').replace(/\/$/, '');
}

/** Lets work finish after the response has been sent. Falls back to simply waiting if that is not possible. */
export async function runInBackground(work: Promise<unknown>): Promise<void> {
  const safe = work.catch((error) => console.error('Background task failed:', error instanceof Error ? error.message : error));
  try {
    const ctx = getCloudflareContext().ctx as unknown as { waitUntil?: (p: Promise<unknown>) => void };
    if (ctx.waitUntil) {
      ctx.waitUntil(safe);
      return;
    }
  } catch {
    // No request context: fall through and wait.
  }
  await safe;
}
