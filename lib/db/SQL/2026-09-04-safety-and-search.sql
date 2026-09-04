-- Run this once against the Pulse PostgreSQL database before deploying the new safety/privacy APIs.
ALTER TABLE users ADD COLUMN IF NOT EXISTS message_search_only boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discoverable boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS user_blocks (
  id serial PRIMARY KEY,
  blocker_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_block UNIQUE (blocker_id, blocked_id),
  CONSTRAINT user_block_not_self CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS safety_reports (
  id serial PRIMARY KEY,
  reporter_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  message_id integer,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trigram search makes partial/fuzzy discovery much more scalable than an unindexed '%term%' scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS users_username_trgm_idx ON users USING gin (lower(username) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS users_display_name_trgm_idx ON users USING gin (lower(display_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON user_blocks (blocked_id);
CREATE INDEX IF NOT EXISTS safety_reports_status_idx ON safety_reports (status, created_at DESC);
