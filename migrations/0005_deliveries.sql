-- Deliveries in two steps, with their paperwork.
--
-- A delivery is recorded by the receiver (PENDING), then approved by somebody else, and only
-- then does its stock reach the shelf. Its lines are therefore kept here, not only as movements:
-- what was counted, what the delivery note said, and what the purchase order still expected.
--
-- Files (the delivery note, the supplier's invoice, the LPO) are kept in R2; this table is the
-- record of each: what it is, who attached it, when, and the SHA-256 of its bytes.
--
-- supplier_item_map is what the unit has learned about a supplier's wording: "Dhanwantharam
-- 200ml (Box of 12)" is item X, and 1 on the note is 12 of ours.

ALTER TABLE receipts ADD COLUMN status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED'));
ALTER TABLE receipts ADD COLUMN note_no TEXT;
ALTER TABLE receipts ADD COLUMN note_date TEXT;
ALTER TABLE receipts ADD COLUMN decided_by TEXT;
ALTER TABLE receipts ADD COLUMN decided_by_name TEXT;
ALTER TABLE receipts ADD COLUMN decided_at TEXT;
ALTER TABLE receipts ADD COLUMN decision_note TEXT;
CREATE INDEX IF NOT EXISTS ix_receipts_status ON receipts (unit_id, status, at DESC);

CREATE TABLE IF NOT EXISTS receipt_lines (
  id          TEXT PRIMARY KEY,
  receipt_id  TEXT NOT NULL REFERENCES receipts(id),
  item_id     TEXT NOT NULL REFERENCES items(id),
  qty         REAL NOT NULL CHECK (qty > 0),      -- counted by the receiver, in the item's own unit
  note_qty    REAL,                               -- what the delivery note says, in the item's unit
  unit_cost   REAL NOT NULL DEFAULT 0,
  batch_no    TEXT,
  expiry      TEXT,
  note_text   TEXT,                               -- the line as the supplier printed it
  po_qty      REAL,                               -- still to come on the order when this was recorded
  po_cost     REAL,                               -- the order's price
  note        TEXT
);
CREATE INDEX IF NOT EXISTS ix_receipt_lines ON receipt_lines (receipt_id);

-- One row per posted delivery. Its primary key is what stops two approvals posting stock twice.
CREATE TABLE IF NOT EXISTS receipt_posted (
  receipt_id  TEXT PRIMARY KEY REFERENCES receipts(id),
  at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
  id                TEXT PRIMARY KEY,
  unit_id           TEXT NOT NULL REFERENCES units(id),
  doc_type          TEXT NOT NULL,                -- RECEIPT
  doc_id            TEXT NOT NULL,
  kind              TEXT NOT NULL,                -- NOTE | INVOICE | LPO | OTHER
  name              TEXT NOT NULL,
  mime              TEXT NOT NULL,
  bytes             INTEGER NOT NULL,
  sha256            TEXT NOT NULL,
  r2_key            TEXT NOT NULL,
  uploaded_by       TEXT NOT NULL,
  uploaded_by_name  TEXT NOT NULL,
  uploaded_at       TEXT NOT NULL,
  removed_at        TEXT,
  removed_by_name   TEXT
);
CREATE INDEX IF NOT EXISTS ix_files_doc ON files (doc_type, doc_id);

CREATE TABLE IF NOT EXISTS supplier_item_map (
  unit_id      TEXT NOT NULL REFERENCES units(id),
  supplier_id  TEXT NOT NULL REFERENCES suppliers(id),
  text_key     TEXT NOT NULL,                     -- the supplier's wording, normalised
  note_text    TEXT NOT NULL,                     -- as last seen
  item_id      TEXT NOT NULL REFERENCES items(id),
  factor       REAL NOT NULL DEFAULT 1 CHECK (factor > 0),   -- 1 on the note = this many of the item's unit
  updated_at   TEXT NOT NULL,
  updated_by   TEXT NOT NULL,
  PRIMARY KEY (unit_id, supplier_id, text_key)
);
