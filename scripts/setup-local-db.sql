-- Local PostgreSQL setup for eAvizat.
-- Run with: psql -U postgres -f scripts/setup-local-db.sql

\set ON_ERROR_STOP on

SELECT 'CREATE ROLE eavizat WITH LOGIN PASSWORD ''eavizat'''
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'eavizat')
\gexec

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

ALTER TABLE app_users OWNER TO eavizat;
ALTER TABLE email_verification_codes OWNER TO eavizat;
ALTER INDEX email_verification_codes_email_idx OWNER TO eavizat;

GRANT CONNECT ON DATABASE eavizat TO eavizat;
GRANT USAGE ON SCHEMA public TO eavizat;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eavizat;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO eavizat;
