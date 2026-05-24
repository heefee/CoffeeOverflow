import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for email verification");
  }

  pool ??= new Pool({
    connectionString,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  return pool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  await ensureAuthSchema();
  return getPool().query<T>(text, values);
}

export async function rawQuery<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}

export async function ensureAuthSchema() {
  schemaReady ??= (async () => {
    const db = getPool();
    await db.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        cnp TEXT,
        provider TEXT NOT NULL DEFAULT 'roeid',
        is_mock BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS email_verification_codes_email_idx
      ON email_verification_codes (email, created_at DESC);
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS property_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        property_ref TEXT NOT NULL,
        property_label TEXT NOT NULL,
        property_address TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, property_ref)
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS property_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        property_ref TEXT NOT NULL,
        authorization_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        notify_at TIMESTAMPTZ NOT NULL,
        email_sent_at TIMESTAMPTZ,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS property_notifications_unique_idx
      ON property_notifications (user_id, property_ref, authorization_id, expires_at);
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS property_notifications_user_idx
      ON property_notifications (user_id, created_at DESC);
    `);
  })();

  return schemaReady;
}
