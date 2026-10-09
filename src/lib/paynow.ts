import { getVar } from '@/lib/cloudflare';

// Paynow Zimbabwe, server side only. The integration key never leaves the Worker.
//
// Every request and reply carries a hash: the values of all fields in the order they
// appear (leaving out the hash itself), followed by the integration key, run through
// SHA-512 and written as upper-case hex.

const BASE = 'https://www.paynow.co.zw/interface';

export class PaynowError extends Error {}

export interface PaynowConfig {
  integrationId: string;
  integrationKey: string;
  /** In test mode Paynow only accepts the merchant's own email as the sign-in email. */
  testEmail: string | null;
}

export function getPaynowConfig(): PaynowConfig | null {
  const integrationId = getVar('PAYNOW_INTEGRATION_ID');
  const integrationKey = getVar('PAYNOW_INTEGRATION_KEY');
  if (!integrationId || !integrationKey) return null;

  const testMode = getVar('PAYNOW_TEST_MODE')?.toLowerCase() === 'true';
  const testEmail = testMode ? (getVar('PAYNOW_MERCHANT_EMAIL') ?? getVar('ADMIN_EMAIL') ?? null) : null;
  return { integrationId, integrationKey, testEmail };
}

type Fields = [string, string][];

export interface PaynowStatus {
  reference: string | null;
  paynowReference: string | null;
  amount: string | null;
  status: string;
  pollUrl: string | null;
}

export type PaynowOutcome = 'paid' | 'failed' | 'pending';

const encoder = new TextEncoder();

async function sha512Upper(text: string) {
  const digest = await crypto.subtle.digest('SHA-512', encoder.encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

async function signFields(fields: Fields, key: string) {
  const values = fields.filter(([name]) => name.toLowerCase() !== 'hash').map(([, value]) => value);
  return sha512Upper(values.join('') + key);
}

function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Paynow only ever sends customers to, and polls, its own addresses. */
function assertPaynowUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PaynowError('Paynow returned an address that could not be read.');
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || !(host === 'paynow.co.zw' || host.endsWith('.paynow.co.zw'))) {
    throw new PaynowError('Paynow returned an address that is not on paynow.co.zw.');
  }
  return url.toString();
}

function formatAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

/** Reads a form-encoded reply, checks its hash when it has one and turns errors into exceptions. */
async function readReply(text: string, config: PaynowConfig) {
  const pairs: Fields = Array.from(new URLSearchParams(text.trim()).entries());
  const reply = new Map(pairs.map(([name, value]) => [name.toLowerCase(), value]));

  const status = reply.get('status')?.toLowerCase();
  if (status === 'error') {
    throw new PaynowError(reply.get('error') || 'Paynow rejected the request.');
  }

  const received = reply.get('hash');
  if (received) {
    const expected = await signFields(pairs, config.integrationKey);
    if (!sameHash(received.toUpperCase(), expected)) {
      throw new PaynowError('Paynow reply failed its security check.');
    }
  }
  return reply;
}

async function request(url: string, body: string, config: PaynowConfig) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new PaynowError('Could not reach Paynow.');
  }
  const text = await response.text();
  if (!response.ok) throw new PaynowError(`Paynow answered with HTTP ${response.status}.`);
  return readReply(text, config);
}

async function send(path: string, fields: Fields, config: PaynowConfig) {
  const hash = await signFields(fields, config.integrationKey);
  const body = new URLSearchParams([...fields, ['hash', hash]]).toString();
  return request(`${BASE}/${path}`, body, config);
}

interface InitiateInput {
  reference: string;
  amountCents: number;
  info: string;
  returnUrl: string;
  resultUrl: string;
  email: string;
}

function baseFields(config: PaynowConfig, input: InitiateInput): Fields {
  return [
    ['id', config.integrationId],
    ['reference', input.reference],
    ['amount', formatAmount(input.amountCents)],
    ['additionalinfo', input.info],
    ['returnurl', input.returnUrl],
    ['resulturl', input.resultUrl],
    ['authemail', config.testEmail ?? input.email],
  ];
}

/** Card and other wallets: the customer is sent to a Paynow page to pay. */
export async function initiateWeb(config: PaynowConfig, input: InitiateInput) {
  const reply = await send('initiatetransaction', [...baseFields(config, input), ['status', 'Message']], config);

  const browserUrl = reply.get('browserurl');
  const pollUrl = reply.get('pollurl');
  if (!browserUrl || !pollUrl) throw new PaynowError('Paynow did not return a payment link.');
  return { redirectUrl: assertPaynowUrl(browserUrl), pollUrl: assertPaynowUrl(pollUrl) };
}

/** Ecocash and OneMoney: Paynow prompts the customer's phone for a PIN. */
export async function initiateMobile(
  config: PaynowConfig,
  input: InitiateInput & { phone: string; method: 'ecocash' | 'onemoney' },
) {
  const fields: Fields = [
    ...baseFields(config, input),
    ['phone', input.phone],
    ['method', input.method],
    ['status', 'Message'],
  ];
  const reply = await send('remotetransaction', fields, config);

  const pollUrl = reply.get('pollurl');
  if (!pollUrl) throw new PaynowError('Paynow did not return a status link.');
  return {
    pollUrl: assertPaynowUrl(pollUrl),
    paynowReference: reply.get('paynowreference') ?? null,
    instructions: reply.get('instructions') ?? null,
  };
}

function toStatus(reply: Map<string, string>): PaynowStatus {
  return {
    reference: reply.get('reference') ?? null,
    paynowReference: reply.get('paynowreference') ?? null,
    amount: reply.get('amount') ?? null,
    status: reply.get('status') ?? 'Unknown',
    pollUrl: reply.get('pollurl') ?? null,
  };
}

/** Asks Paynow where a payment stands. This is the source of truth for an order's payment. */
export async function pollTransaction(config: PaynowConfig, pollUrl: string): Promise<PaynowStatus> {
  const reply = await request(assertPaynowUrl(pollUrl), '', config);
  return toStatus(reply);
}

/**
 * Reads the update Paynow posts to our result URL. Returns null unless the hash checks out.
 * Callers still confirm by polling, so a forged update cannot mark anything paid.
 */
export async function parseStatusUpdate(config: PaynowConfig, body: string): Promise<PaynowStatus | null> {
  const pairs: Fields = Array.from(new URLSearchParams(body.trim()).entries());
  const reply = new Map(pairs.map(([name, value]) => [name.toLowerCase(), value]));

  const received = reply.get('hash');
  if (!received) return null;
  const expected = await signFields(pairs, config.integrationKey);
  if (!sameHash(received.toUpperCase(), expected)) return null;
  return toStatus(reply);
}

export function classifyStatus(status: string): PaynowOutcome {
  switch (status.trim().toLowerCase()) {
    case 'paid':
    case 'awaiting delivery':
    case 'delivered':
      return 'paid';
    case 'cancelled':
    case 'failed':
    case 'refunded':
    case 'disputed':
      return 'failed';
    default:
      return 'pending';
  }
}
