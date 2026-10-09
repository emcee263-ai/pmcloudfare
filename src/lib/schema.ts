// Database schema. db.ts applies any migration the database has not seen yet,
// the first time the app talks to it, so there is nothing to run by hand.
//
// To change the schema later, add a new migration with the next version number.
// Never edit one that has already been applied.

export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,

      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,

      `CREATE TABLE IF NOT EXISTS auth_throttle (
        key TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL,
        reset_at INTEGER NOT NULL
      )`,

      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
        is_drop INTEGER NOT NULL DEFAULT 0,
        drop_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,

      // The CHECK on stock_quantity is what makes overselling impossible: a batch that
      // would take stock below zero fails and is rolled back as a whole.
      `CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        size TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'Black',
        stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        sku TEXT UNIQUE,
        UNIQUE (product_id, size, color)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id)`,

      `CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id)`,

      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
        payment_method TEXT NOT NULL,
        payment_status TEXT,
        payment_instructions TEXT,
        paynow_reference TEXT,
        paynow_poll_url TEXT,
        subtotal_cents INTEGER NOT NULL,
        discount_cents INTEGER NOT NULL DEFAULT 0,
        total_cents INTEGER NOT NULL,
        coupon_code TEXT,
        shipping_address TEXT NOT NULL,
        stock_released INTEGER NOT NULL DEFAULT 0,
        last_polled_at INTEGER,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        paid_at TEXT,
        confirmation_sent_at TEXT,
        email_error TEXT,
        review_note TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at)`,

      // Product name, size and price are copied onto each line so order history
      // survives later edits to, or deletion of, the product.
      `CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        size TEXT NOT NULL,
        color TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price_cents INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`,
    ],
  },
  {
    version: 2,
    statements: [
      // One-hour, single-use links for choosing a new password. Only a hash of the token is stored.
      `CREATE TABLE IF NOT EXISTS password_resets (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE INDEX IF NOT EXISTS idx_resets_user ON password_resets(user_id)`,
    ],
  },
];
