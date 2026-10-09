import type { D1Database } from '@/lib/cloudflare';
import { getDb } from '@/lib/db';
import { fromCents } from '@/lib/utils';
import type { Order, OrderItem, OrderStatus, PaymentMethod, ShippingAddress } from '@/types';

export interface OrderRow {
  id: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: string | null;
  payment_instructions: string | null;
  paynow_reference: string | null;
  paynow_poll_url: string | null;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  coupon_code: string | null;
  shipping_address: string;
  stock_released: number;
  last_polled_at: number | null;
  created_at: string;
  paid_at: string | null;
  confirmation_sent_at: string | null;
  email_error: string | null;
  review_note: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price_cents: number;
}

function parseAddress(raw: string): ShippingAddress {
  try {
    return JSON.parse(raw) as ShippingAddress;
  } catch {
    return { full_name: '', email: '', phone: '', line1: '', city: '', region: '', country: '' };
  }
}

function toItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    order_id: row.order_id,
    variant_id: row.variant_id,
    product_name: row.product_name,
    size: row.size,
    color: row.color,
    quantity: row.quantity,
    price_at_purchase: fromCents(row.price_cents),
  };
}

function toOrder(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    user_id: row.user_id,
    email: row.email,
    status: row.status,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    payment_instructions: row.payment_instructions,
    paynow_reference: row.paynow_reference,
    subtotal: fromCents(row.subtotal_cents),
    discount: fromCents(row.discount_cents),
    total_amount: fromCents(row.total_cents),
    coupon_code: row.coupon_code,
    shipping_address: parseAddress(row.shipping_address),
    created_at: row.created_at,
    paid_at: row.paid_at,
    confirmation_sent_at: row.confirmation_sent_at,
    email_error: row.email_error,
    review_note: row.review_note,
    order_items: items.map(toItem),
  };
}

function combine(orders: OrderRow[], items: OrderItemRow[]): Order[] {
  const byOrder = new Map<string, OrderItemRow[]>();
  for (const item of items) {
    const list = byOrder.get(item.order_id);
    if (list) list.push(item);
    else byOrder.set(item.order_id, [item]);
  }
  return orders.map((row) => toOrder(row, byOrder.get(row.id) ?? []));
}

// ---------- reading ----------

export async function getOrderRow(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<OrderRow>();
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = await getDb();
  const [orders, items] = await db.batch<unknown>([
    db.prepare('SELECT * FROM orders WHERE id = ?').bind(id),
    db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(id),
  ]);
  const row = (orders.results as OrderRow[])[0];
  return row ? toOrder(row, items.results as OrderItemRow[]) : null;
}

export async function listUserOrders(userId: string): Promise<Order[]> {
  const db = await getDb();
  const [orders, items] = await db.batch<unknown>([
    db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').bind(userId),
    db
      .prepare('SELECT * FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)')
      .bind(userId),
  ]);
  return combine(orders.results as OrderRow[], items.results as OrderItemRow[]);
}

export async function listAllOrders(limit = 100): Promise<Order[]> {
  const db = await getDb();
  const [orders, items] = await db.batch<unknown>([
    db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?').bind(limit),
    db
      .prepare(
        'SELECT * FROM order_items WHERE order_id IN (SELECT id FROM orders ORDER BY created_at DESC LIMIT ?)',
      )
      .bind(limit),
  ]);
  return combine(orders.results as OrderRow[], items.results as OrderItemRow[]);
}

export interface OrderStats {
  byStatus: Record<string, number>;
  revenue: number;
}

export async function getOrderStats(): Promise<OrderStats> {
  const db = await getDb();
  const { results } = await db
    .prepare('SELECT status, COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS cents FROM orders GROUP BY status')
    .all<{ status: string; count: number; cents: number }>();

  const byStatus: Record<string, number> = {};
  let revenueCents = 0;
  for (const row of results) {
    byStatus[row.status] = row.count;
    if (row.status === 'paid' || row.status === 'shipped' || row.status === 'delivered') {
      revenueCents += row.cents;
    }
  }
  return { byStatus, revenue: fromCents(revenueCents) };
}

// ---------- creating an order ----------

export interface NewOrderLine {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  priceCents: number;
}

export interface NewOrder {
  userId: string | null;
  email: string;
  paymentMethod: PaymentMethod;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  couponCode: string | null;
  address: ShippingAddress;
  lines: NewOrderLine[];
}

export class OutOfStockError extends Error {
  constructor() {
    super('One of the items just sold out.');
  }
}

function isConstraintError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /CHECK constraint failed|FOREIGN KEY constraint failed|SQLITE_CONSTRAINT/i.test(message);
}

/**
 * Creates the order, its lines and takes the stock, all in one transaction.
 * If any size lacks stock the CHECK on stock_quantity fails and nothing is saved.
 */
export async function createOrder(db: D1Database, input: NewOrder): Promise<string> {
  const id = crypto.randomUUID();

  const statements = [
    db
      .prepare(
        `INSERT INTO orders (id, user_id, email, status, payment_method, subtotal_cents, discount_cents, total_cents, coupon_code, shipping_address)
         VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        input.userId,
        input.email,
        input.paymentMethod,
        input.subtotalCents,
        input.discountCents,
        input.totalCents,
        input.couponCode,
        JSON.stringify(input.address),
      ),
    ...input.lines.map((line) =>
      db
        .prepare(
          `INSERT INTO order_items (id, order_id, variant_id, product_name, size, color, quantity, price_cents)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), id, line.variantId, line.productName, line.size, line.color, line.quantity, line.priceCents),
    ),
    ...input.lines.map((line) =>
      db
        .prepare('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?')
        .bind(line.quantity, line.variantId),
    ),
  ];

  try {
    await db.batch(statements);
  } catch (error) {
    if (isConstraintError(error)) throw new OutOfStockError();
    throw error;
  }
  return id;
}

// ---------- stock ----------

/** Puts an order's stock back on the shelf. Runs at most once per order. */
export async function releaseStock(db: D1Database, orderId: string) {
  const claim = await db
    .prepare('UPDATE orders SET stock_released = 1 WHERE id = ? AND stock_released = 0')
    .bind(orderId)
    .run();
  if (claim.meta.changes !== 1) return;

  const { results } = await db
    .prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL')
    .bind(orderId)
    .all<{ variant_id: string; quantity: number }>();
  if (results.length === 0) return;

  await db.batch(
    results.map((item) =>
      db
        .prepare('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?')
        .bind(item.quantity, item.variant_id),
    ),
  );
}

/** Takes the stock again for an order whose payment arrived after it was cancelled. */
async function reserveStockAgain(db: D1Database, orderId: string): Promise<boolean> {
  const { results } = await db
    .prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL')
    .bind(orderId)
    .all<{ variant_id: string; quantity: number }>();

  try {
    await db.batch([
      ...results.map((item) =>
        db
          .prepare('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?')
          .bind(item.quantity, item.variant_id),
      ),
      db.prepare('UPDATE orders SET stock_released = 0 WHERE id = ?').bind(orderId),
    ]);
    return true;
  } catch (error) {
    if (isConstraintError(error)) return false;
    throw error;
  }
}

// ---------- status changes ----------

/** Cancels an order that is still waiting for payment and returns its stock. */
export async function cancelPendingOrder(db: D1Database, orderId: string, paymentStatus?: string | null) {
  const result = await db
    .prepare(
      "UPDATE orders SET status = 'cancelled', payment_status = COALESCE(?, payment_status) WHERE id = ? AND status = 'pending'",
    )
    .bind(paymentStatus ?? null, orderId)
    .run();
  if (result.meta.changes !== 1) return false;
  await releaseStock(db, orderId);
  return true;
}

/**
 * Marks an order paid. Returns transitioned: true only the first time, so the
 * caller sends the confirmation email exactly once.
 */
export async function markOrderPaid(
  db: D1Database,
  row: OrderRow,
  paynowStatus: string,
  paynowReference: string | null,
) {
  const result = await db
    .prepare(
      `UPDATE orders
       SET status = 'paid', payment_status = ?, paynow_reference = COALESCE(?, paynow_reference), paid_at = ?
       WHERE id = ? AND status IN ('pending', 'cancelled')`,
    )
    .bind(paynowStatus, paynowReference, new Date().toISOString(), row.id)
    .run();
  if (result.meta.changes !== 1) return { transitioned: false, needsReview: false };

  let needsReview = false;
  if (row.status === 'cancelled') {
    let note = 'Payment arrived after this order was cancelled.';
    if (row.stock_released === 1) {
      if (await reserveStockAgain(db, row.id)) {
        note += ' The stock has been set aside again.';
      } else {
        needsReview = true;
        note +=
          ' Some items are no longer in stock, so no confirmation email was sent. Refund the customer or fulfil what you can.';
      }
    }
    await db.prepare('UPDATE orders SET review_note = ? WHERE id = ?').bind(note, row.id).run();
  }
  return { transitioned: true, needsReview };
}

/** Owner changes: ship, deliver, cancel. A cancelled order cannot be reopened. */
export async function setOrderStatus(
  db: D1Database,
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string; code: number }> {
  const row = await getOrderRow(db, orderId);
  if (!row) return { ok: false, error: 'Order not found.', code: 404 };
  if (row.status === status) return { ok: true };
  if (row.status === 'cancelled') {
    return { ok: false, error: 'A cancelled order cannot be reopened. Ask the customer to place a new one.', code: 409 };
  }

  if (status === 'cancelled') {
    await db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").bind(orderId).run();
    await releaseStock(db, orderId);
    return { ok: true };
  }

  await db
    .prepare('UPDATE orders SET status = ?, paid_at = COALESCE(paid_at, ?) WHERE id = ?')
    .bind(status, status === 'pending' ? null : new Date().toISOString(), orderId)
    .run();
  return { ok: true };
}
