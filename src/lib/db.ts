import { getEnv, type D1Database } from '@/lib/cloudflare';
import { MIGRATIONS } from '@/lib/schema';

let ready: Promise<void> | null = null;

async function applyMigrations(db: D1Database) {
  await db
    .prepare('CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    .run();

  const row = await db
    .prepare("SELECT value FROM schema_meta WHERE key = 'version'")
    .first<{ value: string }>();
  const current = row ? Number(row.value) : 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.batch(migration.statements.map((sql) => db.prepare(sql)));
    await db
      .prepare(
        "INSERT INTO schema_meta (key, value) VALUES ('version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      )
      .bind(String(migration.version))
      .run();
  }
}

/** Returns the D1 database, creating or upgrading its tables on first use. */
export async function getDb(): Promise<D1Database> {
  const db = getEnv().DB;
  if (!db) {
    throw new Error('The D1 database binding "DB" is missing. Check d1_databases in wrangler.jsonc.');
  }
  if (!ready) {
    ready = applyMigrations(db).catch((error) => {
      ready = null; // try again on the next request
      throw error;
    });
  }
  await ready;
  return db;
}
