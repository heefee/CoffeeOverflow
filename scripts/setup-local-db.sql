-- Local PostgreSQL setup for eAvizat.
-- Run with: psql -U postgres -f scripts/setup-local-db.sql

\set ON_ERROR_STOP on

SELECT 'CREATE ROLE eavizat WITH LOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'eavizat')
\gexec

ALTER ROLE eavizat PASSWORD NULL;

SELECT 'CREATE DATABASE eavizat OWNER eavizat'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'eavizat')
\gexec

\connect eavizat

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

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_verification_codes_email_idx
ON email_verification_codes (email, created_at DESC);

CREATE TABLE IF NOT EXISTS property_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  property_ref TEXT NOT NULL,
  property_label TEXT NOT NULL,
  property_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_ref)
);

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

CREATE UNIQUE INDEX IF NOT EXISTS property_notifications_unique_idx
ON property_notifications (user_id, property_ref, authorization_id, expires_at);

CREATE INDEX IF NOT EXISTS property_notifications_user_idx
ON property_notifications (user_id, created_at DESC);

ALTER SCHEMA public OWNER TO eavizat;
ALTER TABLE app_users OWNER TO eavizat;
ALTER TABLE email_verification_codes OWNER TO eavizat;
ALTER TABLE property_subscriptions OWNER TO eavizat;
ALTER TABLE property_notifications OWNER TO eavizat;
ALTER INDEX email_verification_codes_email_idx OWNER TO eavizat;
ALTER INDEX property_notifications_unique_idx OWNER TO eavizat;
ALTER INDEX property_notifications_user_idx OWNER TO eavizat;

GRANT CONNECT ON DATABASE eavizat TO eavizat;
GRANT USAGE, CREATE ON SCHEMA public TO eavizat;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eavizat;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO eavizat;
