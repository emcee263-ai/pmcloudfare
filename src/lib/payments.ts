import type { D1Database } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { notifyOrderPaid } from '@/lib/email';
import { cancelPendingOrder, getOrderRow, markOrderPaid, type OrderRow } from '@/lib/orders';
import {
  classifyStatus,
  getPaynowConfig,
  pollTransaction,
  type PaynowOutcome,
  type PaynowStatus,
} from '@/lib/paynow';
import { isoSeconds } from '@/lib/utils';

/** A payment nobody finished within this long is given up on and its stock goes back on sale. */
const STALE_MINUTES = 45;
/** The status page asks every few seconds; Paynow is asked at most this often per order. */
const POLL_GAP_SECONDS = 3;

function amountMatches(reported: string | null, totalCents: number) {
  if (!reported) return true;
  const value = Number(reported);
  if (!Number.isFinite(value)) return true;
  return Math.abs(Math.round(value * 100) - totalCents) <= 1;
}

/** Applies what Paynow says about a payment to the order. Safe to call repeatedly. */
export async function applyPaynowStatus(
  db: D1Database,
  row: OrderRow,
  update: PaynowStatus,
  origin: string,
): Promise<PaynowOutcome> {
  const outcome = classifyStatus(update.status);

  if (outcome === 'paid') {
    if (!amountMatches(update.amount, row.total_cents)) {
      await db
        .prepare('UPDATE orders SET review_note = ? WHERE id = ?')
        .bind(
          `Paynow reports "${update.status}" for ${update.amount}, which is not the order total. Check this payment in your Paynow dashboard before shipping.`,
          row.id,
        )
        .run();
      return 'pending';
    }

    const { transitioned, needsReview } = await markOrderPaid(db, row, update.status, update.paynowReference);
    if (transitioned && !needsReview) {
      await notifyOrderPaid(row.id, origin, { adminCopy: true });
    }
    return 'paid';
  }

  if (outcome === 'failed') {
    await cancelPendingOrder(db, row.id, update.status);
    return 'failed';
  }

  await db
    .prepare(
      "UPDATE orders SET payment_status = ?, paynow_reference = COALESCE(?, paynow_reference) WHERE id = ? AND status = 'pending'",
    )
    .bind(update.status, update.paynowReference, row.id)
    .run();
  return 'pending';
}

/**
 * Asks Paynow about an order and updates it. Returns the order as it stands afterwards.
 * `force` is for Paynow's own result notification: it skips the rate limit and also
 * looks at cancelled orders, so a payment that arrives late is not lost.
 */
export async function refreshOrder(
  orderId: string,
  origin: string,
  options: { force?: boolean } = {},
): Promise<OrderRow | null> {
  const db = await getDb();
  const row = await getOrderRow(db, orderId);
  if (!row) return null;

  const pollUrl = row.paynow_poll_url;
  const canPoll = Boolean(pollUrl) && (row.status === 'pending' || (options.force === true && row.status === 'cancelled'));
  if (!pollUrl || !canPoll) return row;

  const config = getPaynowConfig();
  if (!config) return row;

  const now = Math.floor(Date.now() / 1000);
  if (options.force) {
    await db.prepare('UPDATE orders SET last_polled_at = ? WHERE id = ?').bind(now, row.id).run();
  } else {
    // One caller wins the right to poll; the rest read the order as it is.
    const claim = await db
      .prepare('UPDATE orders SET last_polled_at = ? WHERE id = ? AND (last_polled_at IS NULL OR last_polled_at <= ?)')
      .bind(now, row.id, now - POLL_GAP_SECONDS)
      .run();
    if (claim.meta.changes !== 1) return row;
  }

  try {
    const update = await pollTransaction(config, pollUrl);
    await applyPaynowStatus(db, row, update, origin);
  } catch (error) {
    console.error('Paynow poll failed:', error instanceof Error ? error.message : error);
    return row;
  }
  return getOrderRow(db, row.id);
}

/**
 * Gives up on orders that have waited too long for payment, so reserved stock is not
 * held forever. Paynow is asked first, in case the customer did pay.
 */
export async function expireStaleOrders(db: D1Database, origin: string, max = 5) {
  const cutoff = isoSeconds(new Date(Date.now() - STALE_MINUTES * 60_000));
  const { results } = await db
    .prepare("SELECT * FROM orders WHERE status = 'pending' AND created_at < ? ORDER BY created_at LIMIT ?")
    .bind(cutoff, max)
    .all<OrderRow>();

  const config = getPaynowConfig();
  for (const row of results) {
    if (config && row.paynow_poll_url) {
      try {
        const update = await pollTransaction(config, row.paynow_poll_url);
        const outcome = await applyPaynowStatus(db, row, update, origin);
        if (outcome !== 'pending') continue;
      } catch (error) {
        // Paynow could not be reached. Leave the order for the next pass instead of risking a paid one.
        console.error('Paynow poll failed while expiring an order:', error instanceof Error ? error.message : error);
        continue;
      }
    }
    await cancelPendingOrder(db, row.id, 'Expired');
  }
}
