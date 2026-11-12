-- Enterprise features (feature 14). Every one is switched off per unit until a unit
-- administrator switches it on in Settings; the tables simply stay empty until then.

-- ── Month close ────────────────────────────────────────────────────────────────────────
-- A closed month cannot change. The trigger is the guarantee, whichever code path or import
-- tries: no movement may be dated in a closed Gulf month. Reopening deletes the row, with a
-- reason in the activity log.
CREATE TABLE IF NOT EXISTS closed_periods (
  unit_id         TEXT NOT NULL REFERENCES units(id),
  month           TEXT NOT NULL,                  -- YYYY-MM, Gulf time
  closed_at       TEXT NOT NULL,
  closed_by       TEXT NOT NULL,
  closed_by_name  TEXT NOT NULL,
  note            TEXT,
  PRIMARY KEY (unit_id, month)
);

CREATE TRIGGER IF NOT EXISTS movements_period_closed
BEFORE INSERT ON movements
WHEN EXISTS (SELECT 1 FROM closed_periods c WHERE c.unit_id = NEW.unit_id AND c.month = strftime('%Y-%m', NEW.at, '+4 hours'))
BEGIN
  SELECT RAISE(ABORT, 'PERIOD_CLOSED');
END;

-- ── Pack sizes ─────────────────────────────────────────────────────────────────────────
-- Stock is always kept in the item's own unit (uom). A pack is "this many of it": a carton of
-- 48 to buy, a box of 12 to store. A pack with a supplier is that supplier's own; one without
-- is anybody's. Order and delivery lines keep the pack as written, beside the quantity in
-- the item's unit that the stock engine moves.
CREATE TABLE IF NOT EXISTS item_packs (
  id           TEXT PRIMARY KEY,
  unit_id      TEXT NOT NULL REFERENCES units(id),
  item_id      TEXT NOT NULL REFERENCES items(id),
  supplier_id  TEXT REFERENCES suppliers(id),
  label        TEXT NOT NULL,                    -- "Carton of 48"
  factor       REAL NOT NULL CHECK (factor > 0), -- how many of the item's unit in one
  use_for      TEXT NOT NULL DEFAULT 'BOTH' CHECK (use_for IN ('BUY','STORE','BOTH')),
  updated_at   TEXT,
  updated_by   TEXT
);
CREATE INDEX IF NOT EXISTS ix_item_packs ON item_packs (item_id);

ALTER TABLE po_lines ADD COLUMN pack_label TEXT;
ALTER TABLE po_lines ADD COLUMN pack_qty REAL;
ALTER TABLE po_lines ADD COLUMN pack_cost REAL;
ALTER TABLE receipt_lines ADD COLUMN pack_label TEXT;
ALTER TABLE receipt_lines ADD COLUMN pack_qty REAL;
ALTER TABLE receipt_lines ADD COLUMN pack_cost REAL;

-- ── Quarantine / inspection ────────────────────────────────────────────────────────────
-- Received stock held as not usable: on_hold beside qty, on the balance and on the batch, so
-- nothing that hands stock out (which reads qty) can reach it. Released, it moves to qty.
ALTER TABLE balances ADD COLUMN on_hold REAL NOT NULL DEFAULT 0 CHECK (on_hold >= 0);
ALTER TABLE batches ADD COLUMN on_hold REAL NOT NULL DEFAULT 0 CHECK (on_hold >= 0);
ALTER TABLE items ADD COLUMN inspect INTEGER NOT NULL DEFAULT 0;   -- "inspect on arrival"

-- One row per part of a delivery that went into hold: what, how much, and how it ended.
CREATE TABLE IF NOT EXISTS inspections (
  id               TEXT PRIMARY KEY,
  unit_id          TEXT NOT NULL REFERENCES units(id),
  receipt_id       TEXT NOT NULL REFERENCES receipts(id),
  receipt_line_id  TEXT REFERENCES receipt_lines(id),
  store_id         TEXT NOT NULL REFERENCES stores(id),
  item_id          TEXT NOT NULL REFERENCES items(id),
  batch_no         TEXT NOT NULL DEFAULT '',
  expiry           TEXT NOT NULL DEFAULT '',
  qty              REAL NOT NULL CHECK (qty > 0),
  unit_cost        REAL NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD','RELEASED','REJECTED')),
  held_at          TEXT NOT NULL,
  decided_by       TEXT,
  decided_by_name  TEXT,
  decided_at       TEXT,
  note             TEXT,
  return_id        TEXT
);
CREATE INDEX IF NOT EXISTS ix_inspections ON inspections (unit_id, status, held_at);

-- ── Returns to supplier ────────────────────────────────────────────────────────────────
--   PENDING ──approve──▶ SENT (stock leaves) ──credit──▶ CREDITED
--      └──reject / cancel            └──close without credit, with a reason──▶ CLOSED
CREATE TABLE IF NOT EXISTS supplier_returns (
  id                TEXT PRIMARY KEY,
  unit_id           TEXT NOT NULL REFERENCES units(id),
  ref               TEXT NOT NULL,
  receipt_id        TEXT NOT NULL REFERENCES receipts(id),
  supplier_id       TEXT REFERENCES suppliers(id),
  store_id          TEXT NOT NULL REFERENCES stores(id),
  status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','CREDITED','CLOSED','REJECTED','CANCELLED')),
  reason            TEXT NOT NULL,
  note              TEXT,
  value             REAL NOT NULL DEFAULT 0,       -- the credit expected: qty at the delivery's price
  raised_by         TEXT NOT NULL,
  raised_by_name    TEXT NOT NULL,
  raised_at         TEXT NOT NULL,
  decided_by        TEXT,
  decided_by_name   TEXT,
  decided_at        TEXT,
  decision_note     TEXT,
  credit_no         TEXT,
  credit_date       TEXT,
  credit_amount     REAL,
  credited_by_name  TEXT,
  credited_at       TEXT,
  UNIQUE (unit_id, ref)
);
CREATE INDEX IF NOT EXISTS ix_returns ON supplier_returns (unit_id, status, raised_at DESC);

CREATE TABLE IF NOT EXISTS supplier_return_lines (
  id               TEXT PRIMARY KEY,
  return_id        TEXT NOT NULL REFERENCES supplier_returns(id),
  receipt_line_id  TEXT NOT NULL REFERENCES receipt_lines(id),
  item_id          TEXT NOT NULL REFERENCES items(id),
  batch_no         TEXT NOT NULL DEFAULT '',
  expiry           TEXT NOT NULL DEFAULT '',
  qty              REAL NOT NULL CHECK (qty > 0),
  unit_cost        REAL NOT NULL DEFAULT 0,
  from_hold        INTEGER NOT NULL DEFAULT 0      -- rejected at inspection: it never reached the shelf
);
CREATE INDEX IF NOT EXISTS ix_return_lines ON supplier_return_lines (return_id);

-- ── Shelf locations ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_locations (
  store_id    TEXT NOT NULL REFERENCES stores(id),
  item_id     TEXT NOT NULL REFERENCES items(id),
  location    TEXT NOT NULL,                     -- rack, shelf, bin: "A-3-2", "Fridge 1, top"
  PRIMARY KEY (store_id, item_id)
);
