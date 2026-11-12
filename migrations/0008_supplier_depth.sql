-- Level 9: supplier depth.
--
-- Price history needs no table of its own: it is every approved delivery line, read by item.
-- The index makes that read cheap. The one new table is the record of each purchase order
-- emailed to its supplier: who sent it, to whom, when, and whether Microsoft 365 took it.

CREATE INDEX IF NOT EXISTS ix_receipt_lines_item ON receipt_lines (item_id);
CREATE INDEX IF NOT EXISTS ix_receipts_supplier ON receipts (unit_id, supplier_id, status, at);
CREATE INDEX IF NOT EXISTS ix_po_supplier ON purchase_orders (unit_id, supplier_id, decided_at);

CREATE TABLE IF NOT EXISTS po_emails (
  id          TEXT PRIMARY KEY,
  unit_id     TEXT NOT NULL REFERENCES units(id),
  po_id       TEXT NOT NULL REFERENCES purchase_orders(id),
  to_email    TEXT NOT NULL,
  cc          TEXT,                               -- comma separated, as sent
  subject     TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('SENT','FAILED')),
  error       TEXT,                               -- what the person was told, when it failed
  pdf_sha256  TEXT,                               -- fingerprint of the PDF that was attached
  by_id       TEXT NOT NULL,
  by_name     TEXT NOT NULL,
  at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_po_emails ON po_emails (po_id, at);
