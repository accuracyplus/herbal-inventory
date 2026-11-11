-- The link to a booking or billing system: completed services arrive from outside and their
-- recipes come off the shelf, and a price makes a margin.
--
-- integration_keys   a key per connection, per unit. Only its SHA-256 is kept; the key itself is
--                    shown once, to the administrator who creates it.
-- service_inbox      everything that arrived, by its own reference (unique in the unit, so the
--                    same service sent twice is recorded once). What could not be recorded waits
--                    here with the reason, for a manager to fix the cause and retry.

ALTER TABLE services ADD COLUMN price REAL;              -- the usual price of one, if the unit sets it
ALTER TABLE service_records ADD COLUMN price REAL;       -- charged for one
ALTER TABLE service_records ADD COLUMN revenue REAL;     -- price times how many; NULL when no price is known
ALTER TABLE service_records ADD COLUMN source TEXT;      -- NULL when recorded in the app; else the connection's name
ALTER TABLE service_records ADD COLUMN ext_ref TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_service_records_ext ON service_records (unit_id, ext_ref) WHERE ext_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS integration_keys (
  id            TEXT PRIMARY KEY,
  unit_id       TEXT NOT NULL REFERENCES units(id),
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,
  hint          TEXT NOT NULL,                     -- the first characters, to tell keys apart
  store_id      TEXT NOT NULL REFERENCES stores(id),   -- where stock comes from when a row names no store
  created_at    TEXT NOT NULL,
  created_by    TEXT NOT NULL,
  last_used_at  TEXT,
  revoked_at    TEXT,
  revoked_by    TEXT
);

CREATE TABLE IF NOT EXISTS service_inbox (
  id            TEXT PRIMARY KEY,
  unit_id       TEXT NOT NULL REFERENCES units(id),
  source        TEXT NOT NULL,
  ext_ref       TEXT NOT NULL,
  payload       TEXT NOT NULL,                     -- the row as it arrived, as JSON
  store_id      TEXT,
  status        TEXT NOT NULL CHECK (status IN ('RECORDED','FAILED','DISMISSED')),
  error         TEXT,
  record_id     TEXT,
  received_at   TEXT NOT NULL,
  tried_at      TEXT,
  decided_by    TEXT,
  decision_note TEXT,
  UNIQUE (unit_id, ext_ref)
);
CREATE INDEX IF NOT EXISTS ix_service_inbox ON service_inbox (unit_id, status, received_at DESC);
