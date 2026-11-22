-- The IT asset register (Design Guide D-086, 22 Nov 2026): devices, SIMs and licences in the
-- equipment register, with who holds each, every hand-over with its condition and photos, licence
-- seats, the spares a unit wants to keep, and IT's requests. See docs/it-assets.md.
--
-- Run one statement at a time (wrangler d1 execute --command), as every Inventory migration is;
-- verify with SELECT kind, state FROM assets LIMIT 0 and SELECT * FROM it_requests LIMIT 0.

-- What each piece is. EQUIPMENT is everything already in the register; it keeps its status
-- column (ACTIVE / IN_REPAIR / RETIRED) and its service plan exactly as before.
ALTER TABLE assets ADD COLUMN kind TEXT NOT NULL DEFAULT 'EQUIPMENT';   -- EQUIPMENT | DEVICE | SIM | LICENCE
-- The IT life (D-086): IN_STOCK | ASSIGNED | IN_REPAIR | IDLE | RETIRED. Null for equipment.
ALTER TABLE assets ADD COLUMN state TEXT;
ALTER TABLE assets ADD COLUMN state_since TEXT;
-- Who holds it now: a HiFive ID employee code and the name it had then (lib/roster.js keeps these two only).
ALTER TABLE assets ADD COLUMN holder_code TEXT;
ALTER TABLE assets ADD COLUMN holder_name TEXT;
-- Condition as last seen at a hand-over: NEW | GOOD | FAIR | POOR | DAMAGED.
ALTER TABLE assets ADD COLUMN condition TEXT;
-- A SIM: the last four digits of its number only, never the whole number, and its network.
ALTER TABLE assets ADD COLUMN sim_last4 TEXT;
ALTER TABLE assets ADD COLUMN network TEXT;
-- A licence: how many seats, and when it renews. The product is the asset's name. Never a key.
ALTER TABLE assets ADD COLUMN seats INTEGER;
ALTER TABLE assets ADD COLUMN renews_on TEXT;

-- Every hand-over: issued to somebody, returned, sent for repair, back from repair, retired.
CREATE TABLE IF NOT EXISTS asset_handovers (
  id            TEXT PRIMARY KEY,
  unit_id       TEXT NOT NULL REFERENCES units(id),
  asset_id      TEXT NOT NULL REFERENCES assets(id),
  at            TEXT NOT NULL,
  action        TEXT NOT NULL,          -- ISSUE | RETURN | REPAIR_OUT | REPAIR_BACK | IDLE | RETIRE
  from_code     TEXT,
  from_name     TEXT,
  to_code       TEXT,
  to_name       TEXT,
  condition     TEXT,                   -- as seen at this hand-over
  note          TEXT,
  clearance     INTEGER NOT NULL DEFAULT 0,  -- 1 when taken back at somebody's exit
  by_id         TEXT NOT NULL,
  by_name       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_asset_handovers ON asset_handovers (asset_id, at DESC);
CREATE INDEX IF NOT EXISTS ix_asset_handovers_person ON asset_handovers (unit_id, to_code);

-- Who holds a seat of a licence. Ended rows stay as the history.
CREATE TABLE IF NOT EXISTS licence_seats (
  id            TEXT PRIMARY KEY,
  unit_id       TEXT NOT NULL REFERENCES units(id),
  asset_id      TEXT NOT NULL REFERENCES assets(id),
  holder_code   TEXT NOT NULL,
  holder_name   TEXT NOT NULL,
  from_at       TEXT NOT NULL,
  until_at      TEXT,
  by_name       TEXT NOT NULL,
  ended_by_name TEXT
);
CREATE INDEX IF NOT EXISTS ix_licence_seats ON licence_seats (asset_id, until_at);
CREATE INDEX IF NOT EXISTS ix_licence_seats_person ON licence_seats (unit_id, holder_code);

-- How many spares of a kind of device the unit wants in stock; fewer shows as a shortage.
CREATE TABLE IF NOT EXISTS it_spares (
  unit_id       TEXT NOT NULL REFERENCES units(id),
  category      TEXT NOT NULL,
  min_spare     INTEGER NOT NULL,
  PRIMARY KEY (unit_id, category)
);

-- IT's purchase requests (to the facility approver) and HR's email account requests (to IT).
CREATE TABLE IF NOT EXISTS it_requests (
  id              TEXT PRIMARY KEY,
  unit_id         TEXT NOT NULL REFERENCES units(id),
  ref             TEXT NOT NULL,
  kind            TEXT NOT NULL,        -- PURCHASE | EMAIL_ACCOUNT
  title           TEXT NOT NULL,
  details         TEXT,
  for_code        TEXT,                 -- an email account: who it is for
  for_name        TEXT,
  needed_by       TEXT,
  estimate        REAL,                 -- a purchase: what it should cost (IT prices rule)
  status          TEXT NOT NULL DEFAULT 'PENDING',   -- PENDING | APPROVED | REJECTED | DONE | CANCELLED
  raised_by       TEXT NOT NULL,
  raised_name     TEXT NOT NULL,
  raised_at       TEXT NOT NULL,
  decided_by      TEXT,
  decided_name    TEXT,
  decided_at      TEXT,
  decision_note   TEXT,
  done_name       TEXT,
  done_at         TEXT,
  done_note       TEXT
);
CREATE INDEX IF NOT EXISTS ix_it_requests ON it_requests (unit_id, status, raised_at DESC);
