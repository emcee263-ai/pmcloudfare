import { NextResponse } from 'next/server';
import type { z } from 'zod';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

/** Browsers send an Origin header on form and fetch POSTs. Reject ones from other sites. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
}

type Parsed<S extends z.ZodTypeAny> = { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse };

/** Checks origin and content type, reads the JSON body and validates it. */
export async function parseJson<S extends z.ZodTypeAny>(request: Request, schema: S): Promise<Parsed<S>> {
  if (!isSameOrigin(request)) return { ok: false, response: fail('Request blocked.', 403) };

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { ok: false, response: fail('Send the request as JSON.', 415) };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: fail('The request could not be read.') };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, response: fail(first ? first.message : 'Check the details and try again.') };
  }
  return { ok: true, data: parsed.data };
}
