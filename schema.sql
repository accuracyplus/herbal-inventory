-- HiFive Inventory — D1 schema
-- npx wrangler d1 execute hifive-inventory --remote --file=./schema.sql
--
-- D1 is the system of record for every table here, as in HiFive Transport. There is no
-- workbook to write back to: master data is kept through the Admin screens and every stock
-- change goes through one engine (src/domain/stock.js).
--
-- MULTI-UNIT FROM THE START
--   Every business table carries unit_id. A unit is one HiFive business (Herbal Park, Herbal
--   Valley, Atomic Drugstore, an Al Jebal shop...). A person can hold roles in more than one
--   unit (staff_units), and every query is fenced on the unit chosen for the request.
--
-- THE LEDGER IS THE TRUTH
--   `movements` is append-only, enforced by triggers at the foot of this file. `balances` and
--   `batches` are the running totals the engine keeps beside it, in the same batch, so the two
--   cannot drift. Both refuse to go below zero (CHECK), which is the last line of defence
--   against two people issuing the last bottle at the same moment.

PRAGMA foreign_keys = ON;

-- ── Units, people, access ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS units (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,          -- short, used in references: HP-PO-0001
  name        TEXT NOT NULL,                 -- matched against HiFive ID's entity name
  city        TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  created_by  TEXT
);

CREATE TABLE IF NOT EXISTS staff (
  id           TEXT PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,         -- the HiFive ID employee code (APML131, HPAHC040)
  hfid_sub     TEXT UNIQUE,                  -- linked at first sign-in, never overwritten
  full_name    TEXT NOT NULL,
  group_admin  INTEGER NOT NULL DEFAULT 0,   -- every unit, every role (Group HR, directors)
  active       INTEGER NOT NULL DEFAULT 1,
  updated_at   TEXT,
  updated_by   TEXT
);

-- What a person may do, unit by unit. `stores` is a JSON list of store ids the person may
-- record against, or NULL for every store in the unit.
CREATE TABLE IF NOT EXISTS staff_units (
  staff_id    TEXT NOT NULL REFERENCES staff(id),
  unit_id     TEXT NOT NULL REFERENCES units(id),
  roles       TEXT NOT NULL,                 -- JSON array
  stores      TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT,
  updated_by  TEXT,
  PRIMARY KEY (staff_id, unit_id)
);

CREATE TABLE IF NOT EXISTS settings (
  unit_id  TEXT NOT NULL REFERENCES units(id),
  key      TEXT NOT NULL,
  value    TEXT NOT NULL,
  PRIMARY KEY (unit_id, key)
);

-- Reference numbers, per unit and per document kind: HP-REQ-0001, HP-PO-0001.
CREATE TABLE IF NOT EXISTS counters (
  unit_id  TEXT NOT NULL,
  name     TEXT NOT NULL,
  next     INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (unit_id, name)
);

-- ── Master data ──────────────────────────────────────────────────────────────

-- A place stock is held. MAIN receives from suppliers; SUB stores are fed from it.
CREATE TABLE IF NOT EXISTS stores (
  id          TEXT PRIMARY KEY,
  unit_id     TEXT NOT NULL REFERENCES units(id),
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'SUB' CHECK (kind IN ('MAIN','SUB')),
  sort        INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT,
  updated_by  TEXT,
  UNIQUE (unit_id, code)
);

-- Where stock is used: treatment rooms, the front desk, the pharmacy counter.
CREATE TABLE IF NOT EXISTS areas (
  id          TEXT PRIMARY KEY,
  unit_id     TEXT NOT NULL REFERENCES units(id),
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'ROOM',
  active      INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT,
  updated_by  TEXT,
  UNIQUE (unit_id, code)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id          TEXT PRIMARY KEY,
  unit_id     TEXT NOT NULL REFERENCES units(id),
  name        TEXT NOT NULL,
  contact     TEXT,
  phone       TEXT,
  email       TEXT,
  trn         TEXT,                          -- UAE VAT registration number
  terms       TEXT,                          -- payment terms, as agreed
  lead_days   INTEGER,
  notes       TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT,
  updated_by  TEXT,
  UNIQUE (unit_id, name)
);

CREATE TABLE IF NOT EXISTS items (
  id             TEXT PRIMARY KEY,
  unit_id        TEXT NOT NULL REFERENCES units(id),
  code           TEXT NOT NULL,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'General',
  uom            TEXT NOT NULL DEFAULT 'pcs',  -- unit of measure: bottle, box, kg, pcs
  barcode        TEXT,
  tracks_expiry  INTEGER NOT NULL DEFAULT 0,   -- batches with expiry dates, issued first-expiry-first
  is_linen       INTEGER NOT NULL DEFAULT 0,   -- reusable: available → in use → in wash → available
  avg_cost       REAL NOT NULL DEFAULT 0,      -- weighted average, moved by receipts only
  last_cost      REAL,
  supplier_id    TEXT REFERENCES suppliers(id),
  notes          TEXT,
  active         INTEGER NOT NULL DEFAULT 1,
  updated_at     TEXT,
  updated_by     TEXT,
  UNIQUE (unit_id, code),
  CHECK (NOT (is_linen = 1 AND tracks_expiry = 1))
);
CREATE INDEX IF NOT EXISTS ix_items_unit ON items (unit_id, active, category, name);
CREATE INDEX IF NOT EXISTS ix_items_barcode ON items (unit_id, barcode);

-- Levels are per store: the sub store's reorder point is not the main store's.
--   reorder   at or below this, the item shows as low
--   critical  at or below this, it shows red and appears on Today
--   par       what the store should be topped up to; drives replenishment and PO suggestions
CREATE TABLE IF NOT EXISTS item_levels (
  item_id   TEXT NOT NULL REFERENCES items(id),
  store_id  TEXT NOT NULL REFERENCES stores(id),
  reorder   REAL NOT NULL DEFAULT 0,
  critical  REAL NOT NULL DEFAULT 0,
  par       REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, store_id)
);

-- ── Running totals, kept by the engine beside every movement ────────────────

-- qty is what is on the shelf. For linen, qty is clean-and-available, and in_use / in_wash
-- are the pieces out in rooms and at the laundry.
CREATE TABLE IF NOT EXISTS balances (
  store_id  TEXT NOT NULL REFERENCES stores(id),
  item_id   TEXT NOT NULL REFERENCES items(id),
  qty       REAL NOT NULL DEFAULT 0 CHECK (qty >= 0),
  in_use    REAL NOT NULL DEFAULT 0 CHECK (in_use >= 0),
  in_wash   REAL NOT NULL DEFAULT 0 CHECK (in_wash >= 0),
  PRIMARY KEY (store_id, item_id)
);
CREATE INDEX IF NOT EXISTS ix_balances_item ON balances (item_id);

-- For items that track expiry, the shelf quantity split by batch. The engine keeps the sum of
-- an item's batches in a store equal to its balance. '' means not stated (an expiry nobody
-- recorded is a fact worth showing, not a NULL that slips past a uniqueness check).
CREATE TABLE IF NOT EXISTS batches (
  id           TEXT PRIMARY KEY,
  store_id     TEXT NOT NULL REFERENCES stores(id),
  item_id      TEXT NOT NULL REFERENCES items(id),
  batch_no     TEXT NOT NULL DEFAULT '',
  expiry       TEXT NOT NULL DEFAULT '',       -- YYYY-MM-DD, or '' when unknown
  qty          REAL NOT NULL DEFAULT 0 CHECK (qty >= 0),
  received_at  TEXT,
  UNIQUE (store_id, item_id, batch_no, expiry)
);
CREATE INDEX IF NOT EXISTS ix_batches_fefo ON batches (store_id, item_id, expiry);

-- ── The ledger (append-only) ─────────────────────────────────────────────────
--
--   RECEIPT        in from a supplier (GRN)
--   ISSUE          used: given out to a room or for a purpose
--   TRANSFER_OUT   / TRANSFER_IN — one pair per line, sharing doc_id
--   ADJUST         an approved correction: damaged, expired, lost, found
--   COUNT          a variance posted by an approved stock count
--   OPENING        the starting balance, written once by the import
--   LINEN          a linen piece changing state; qty is the number of pieces, from_state and
--                  to_state say where they went, and the store's total does not change unless
--                  to_state is 'gone' (discarded)
CREATE TABLE IF NOT EXISTS movements (
  id                   TEXT PRIMARY KEY,
  unit_id              TEXT NOT NULL REFERENCES units(id),
  at                   TEXT NOT NULL,
  kind                 TEXT NOT NULL,
  item_id              TEXT NOT NULL REFERENCES items(id),
  store_id             TEXT NOT NULL REFERENCES stores(id),
  batch_id             TEXT,
  qty                  REAL NOT NULL,            -- signed change to the shelf (or pieces moved, for LINEN)
  balance_after        REAL,                     -- shelf quantity in this store afterwards
  from_state           TEXT,                     -- LINEN only
  to_state             TEXT,                     -- LINEN only
  unit_cost            REAL,
  value                REAL,                     -- qty × unit_cost, signed
  doc_type             TEXT,                     -- REQUEST | TRANSFER | RECEIPT | ADJUSTMENT | COUNT | IMPORT
  doc_id               TEXT,
  doc_ref              TEXT,
  area_id              TEXT REFERENCES areas(id),
  counterpart_store_id TEXT,
  reason               TEXT,
  note                 TEXT,
  actor_id             TEXT,
  actor_name           TEXT
);
CREATE INDEX IF NOT EXISTS ix_mov_unit_at   ON movements (unit_id, at DESC);
CREATE INDEX IF NOT EXISTS ix_mov_item      ON movements (item_id, at DESC);
CREATE INDEX IF NOT EXISTS ix_mov_store     ON movements (store_id, at DESC);
CREATE INDEX IF NOT EXISTS ix_mov_doc       ON movements (doc_type, doc_id);
CREATE INDEX IF NOT EXISTS ix_mov_kind      ON movements (unit_id, kind, at);

-- ── Documents ────────────────────────────────────────────────────────────────

-- A request for stock: a therapist asking the store for oil, a sub store asking the main
-- store to top it up. Approved by a manager, then fulfilled by the store as a transfer (to a
-- store) or an issue (to an area).
CREATE TABLE IF NOT EXISTS requests (
  id                 TEXT PRIMARY KEY,
  unit_id            TEXT NOT NULL REFERENCES units(id),
  ref                TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','APPROVED','PARTLY_ISSUED','ISSUED','REJECTED','CANCELLED')),
  urgency            TEXT NOT NULL DEFAULT 'NORMAL' CHECK (urgency IN ('NORMAL','URGENT')),
  from_store_id      TEXT REFERENCES stores(id),  -- which store should supply it
  to_store_id        TEXT REFERENCES stores(id),  -- delivered into a store, or
  area_id            TEXT REFERENCES areas(id),   -- handed out for use in an area
  note               TEXT,
  requested_by       TEXT NOT NULL,
  requested_by_name  TEXT NOT NULL,
  requested_at       TEXT NOT NULL,
  decided_by         TEXT,
  decided_by_name    TEXT,
  decided_at         TEXT,
  decision_note      TEXT,
  closed_at          TEXT,
  UNIQUE (unit_id, ref)
);
CREATE INDEX IF NOT EXISTS ix_requests_open ON requests (unit_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS request_lines (
  id            TEXT PRIMARY KEY,
  request_id    TEXT NOT NULL REFERENCES requests(id),
  item_id       TEXT NOT NULL REFERENCES items(id),
  qty           REAL NOT NULL CHECK (qty > 0),
  approved_qty  REAL,
  issued_qty    REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_request_lines ON request_lines (request_id);

CREATE TABLE IF NOT EXISTS transfers (
  id             TEXT PRIMARY KEY,
  unit_id        TEXT NOT NULL REFERENCES units(id),
  ref            TEXT NOT NULL,
  from_store_id  TEXT NOT NULL REFERENCES stores(id),
  to_store_id    TEXT REFERENCES stores(id),
  area_id        TEXT REFERENCES areas(id),
  request_id     TEXT REFERENCES requests(id),
  note           TEXT,
  by_id          TEXT NOT NULL,
  by_name        TEXT NOT NULL,
  at             TEXT NOT NULL,
  UNIQUE (unit_id, ref)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id               TEXT PRIMARY KEY,
  unit_id          TEXT NOT NULL REFERENCES units(id),
  ref              TEXT NOT NULL,
  supplier_id      TEXT NOT NULL REFERENCES suppliers(id),
  store_id         TEXT NOT NULL REFERENCES stores(id),   -- deliver to
  status           TEXT NOT NULL DEFAULT 'DRAFT'
                   CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','PARTLY_RECEIVED','RECEIVED','REJECTED','CANCELLED')),
  expected_date    TEXT,
  note             TEXT,
  total            REAL NOT NULL DEFAULT 0,
  created_by       TEXT NOT NULL,
  created_by_name  TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  submitted_at     TEXT,
  decided_by       TEXT,
  decided_by_name  TEXT,
  decided_at       TEXT,
  decision_note    TEXT,
  closed_at        TEXT,
  UNIQUE (unit_id, ref)
);
CREATE INDEX IF NOT EXISTS ix_po_open ON purchase_orders (unit_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS po_lines (
  id            TEXT PRIMARY KEY,
  po_id         TEXT NOT NULL REFERENCES purchase_orders(id),
  item_id       TEXT NOT NULL REFERENCES items(id),
  qty           REAL NOT NULL CHECK (qty > 0),
  unit_cost     REAL NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  received_qty  REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_po_lines ON po_lines (po_id);

-- Goods received. With or without a purchase order: small local purchases happen.
CREATE TABLE IF NOT EXISTS receipts (
  id            TEXT PRIMARY KEY,
  unit_id       TEXT NOT NULL REFERENCES units(id),
  ref           TEXT NOT NULL,
  store_id      TEXT NOT NULL REFERENCES stores(id),
  supplier_id   TEXT REFERENCES suppliers(id),
  po_id         TEXT REFERENCES purchase_orders(id),
  invoice_no    TEXT,
  invoice_date  TEXT,
  note          TEXT,
  total         REAL NOT NULL DEFAULT 0,
  by_id         TEXT NOT NULL,
  by_name       TEXT NOT NULL,
  at            TEXT NOT NULL,
  UNIQUE (unit_id, ref)
);

-- A correction to stock. Raised by the store, posted only once somebody else approves it.
CREATE TABLE IF NOT EXISTS adjustments (
  id                 TEXT PRIMARY KEY,
  unit_id            TEXT NOT NULL REFERENCES units(id),
  ref                TEXT NOT NULL,
  store_id           TEXT NOT NULL REFERENCES stores(id),
  reason             TEXT NOT NULL CHECK (reason IN ('DAMAGED','EXPIRED','LOST','FOUND','CORRECTION','SAMPLE','OTHER')),
  note               TEXT,
  status             TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  value              REAL NOT NULL DEFAULT 0,
  requested_by       TEXT NOT NULL,
  requested_by_name  TEXT NOT NULL,
  requested_at       TEXT NOT NULL,
  decided_by         TEXT,
  decided_by_name    TEXT,
  decided_at         TEXT,
  decision_note      TEXT,
  UNIQUE (unit_id, ref)
);
CREATE INDEX IF NOT EXISTS ix_adj_open ON adjustments (unit_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS adjustment_lines (
  id             TEXT PRIMARY KEY,
  adjustment_id  TEXT NOT NULL REFERENCES adjustments(id),
  item_id        TEXT NOT NULL REFERENCES items(id),
  batch_id       TEXT REFERENCES batches(id),
  qty            REAL NOT NULL CHECK (qty <> 0)      -- signed: negative takes stock away
);
CREATE INDEX IF NOT EXISTS ix_adj_lines ON adjustment_lines (adjustment_id);

-- A stock count. The system quantity is snapshotted when the count starts; the variance is
-- counted − snapshot, and it is applied on approval to whatever the balance is by then, so
-- stock used while the count was going on is not counted twice.
CREATE TABLE IF NOT EXISTS counts (
  id                TEXT PRIMARY KEY,
  unit_id           TEXT NOT NULL REFERENCES units(id),
  ref               TEXT NOT NULL,
  store_id          TEXT NOT NULL REFERENCES stores(id),
  category          TEXT,                         -- NULL = the whole store
  blind             INTEGER NOT NULL DEFAULT 1,   -- counters do not see the system quantity
  status            TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','SUBMITTED','APPROVED','CANCELLED')),
  note              TEXT,
  started_by        TEXT NOT NULL,
  started_by_name   TEXT NOT NULL,
  started_at        TEXT NOT NULL,
  submitted_by      TEXT,
  submitted_by_name TEXT,
  submitted_at      TEXT,
  decided_by        TEXT,
  decided_by_name   TEXT,
  decided_at        TEXT,
  decision_note     TEXT,
  UNIQUE (unit_id, ref)
);
CREATE INDEX IF NOT EXISTS ix_counts_open ON counts (unit_id, status, started_at DESC);

CREATE TABLE IF NOT EXISTS count_lines (
  id          TEXT PRIMARY KEY,
  count_id    TEXT NOT NULL REFERENCES counts(id),
  item_id     TEXT NOT NULL REFERENCES items(id),
  expected    REAL NOT NULL,
  counted     REAL CHECK (counted IS NULL OR counted >= 0),
  counted_by  TEXT,
  counted_at  TEXT,
  note        TEXT,
  UNIQUE (count_id, item_id)
);

-- ── History from the old Google Sheet app ────────────────────────────────────
-- Kept as it was, for reference, and deliberately NOT in `movements`: replaying it would count
-- every bottle twice on top of the opening balances the import posts.
CREATE TABLE IF NOT EXISTS legacy_movements (
  id         TEXT PRIMARY KEY,
  unit_id    TEXT NOT NULL REFERENCES units(id),
  at         TEXT,
  type       TEXT,
  item_name  TEXT,
  qty        REAL,
  store      TEXT,
  staff      TEXT,
  purpose    TEXT,
  remarks    TEXT
);
CREATE INDEX IF NOT EXISTS ix_legacy_unit ON legacy_movements (unit_id, at DESC);

-- ── Audit ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  at          TEXT NOT NULL,
  actor_id    TEXT,
  actor_name  TEXT,
  unit_id     TEXT,
  action      TEXT NOT NULL,
  subject     TEXT,
  detail      TEXT,
  ip          TEXT
);
CREATE INDEX IF NOT EXISTS ix_audit_at ON audit_log (unit_id, at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_action ON audit_log (action, at DESC);

-- ── Append-only, enforced here and not in the Worker ─────────────────────────

CREATE TRIGGER IF NOT EXISTS movements_no_update
BEFORE UPDATE ON movements
BEGIN SELECT RAISE(ABORT, 'movements are append-only: post a correcting movement instead'); END;

CREATE TRIGGER IF NOT EXISTS movements_no_delete
BEFORE DELETE ON movements
BEGIN SELECT RAISE(ABORT, 'movements are append-only: post a correcting movement instead'); END;

CREATE TRIGGER IF NOT EXISTS audit_no_update
BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

CREATE TRIGGER IF NOT EXISTS audit_no_delete
BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
