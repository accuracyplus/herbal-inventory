-- Level 10: lab readiness. Generic, and unused until a unit switches on lots.opened.
--
-- An item can say where it is kept and how long it stays usable once opened. Opening a pack is
-- a use (an ISSUE through the stock engine, so cost by department is unchanged); this table
-- keeps what the ledger cannot: when it was opened, where it is in use, the date it must be
-- finished by, and how it ended.

ALTER TABLE items ADD COLUMN storage TEXT;              -- ROOM | FRIDGE | FREEZER, or NULL when not said
ALTER TABLE items ADD COLUMN open_life_days INTEGER;    -- days usable once opened, or NULL

CREATE TABLE IF NOT EXISTS lot_openings (
  id              TEXT PRIMARY KEY,
  unit_id         TEXT NOT NULL REFERENCES units(id),
  store_id        TEXT NOT NULL REFERENCES stores(id),  -- the store it was taken from
  item_id         TEXT NOT NULL REFERENCES items(id),
  batch_id        TEXT,                                 -- the batch it came out of, when the item tracks lots
  batch_no        TEXT,                                 -- as it was, so history reads even after the batch empties
  expiry          TEXT,                                 -- the printed expiry, YYYY-MM-DD, or NULL
  qty             REAL NOT NULL CHECK (qty > 0),        -- packs opened together, usually 1
  opened_at       TEXT NOT NULL,
  opened_by       TEXT NOT NULL,
  opened_by_name  TEXT NOT NULL,
  use_by          TEXT,                                 -- the earlier of the expiry and opened + open life
  area_id         TEXT REFERENCES areas(id),            -- the bench or analyser it is in use at
  department_id   TEXT,
  doc_id          TEXT NOT NULL,                        -- the ISSUE's doc_id: the opening in the ledger
  status          TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','FINISHED','DISCARDED')),
  closed_at       TEXT,
  closed_by       TEXT,
  closed_by_name  TEXT,
  close_reason    TEXT
);
CREATE INDEX IF NOT EXISTS ix_lot_openings_open ON lot_openings (unit_id, status, use_by);
CREATE INDEX IF NOT EXISTS ix_lot_openings_lot ON lot_openings (unit_id, item_id, batch_no);
