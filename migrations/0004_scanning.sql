-- Phone scanning: a computer screen paired with the same person's phone, the scans that pass
-- between them, and extra barcodes for an item (a second supplier's pack, a case and a unit).
--
-- The computer asks for new scans every second or so while a pairing is open. Nothing here is a
-- record of stock: scans only fill in a form the person still checks and saves. Old pairings and
-- their scans are deleted after two days.

CREATE TABLE IF NOT EXISTS scan_sessions (
  id          TEXT PRIMARY KEY,
  unit_id     TEXT NOT NULL REFERENCES units(id),
  staff_id    TEXT NOT NULL REFERENCES staff(id),
  purpose     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  last_at     TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  paired_at   TEXT,
  closed_at   TEXT
);
CREATE INDEX IF NOT EXISTS ix_scan_sessions_age ON scan_sessions (expires_at);

CREATE TABLE IF NOT EXISTS scan_events (
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES scan_sessions(id),
  at          TEXT NOT NULL,
  barcode     TEXT NOT NULL,
  item_id     TEXT NOT NULL REFERENCES items(id)
);
CREATE INDEX IF NOT EXISTS ix_scan_events ON scan_events (session_id, seq);

-- items.barcode stays the item's main barcode; these are the others. A barcode belongs to one
-- item in a unit, wherever it is kept: the code checks both places before saving.
CREATE TABLE IF NOT EXISTS item_barcodes (
  unit_id   TEXT NOT NULL REFERENCES units(id),
  barcode   TEXT NOT NULL,
  item_id   TEXT NOT NULL REFERENCES items(id),
  added_at  TEXT NOT NULL,
  added_by  TEXT NOT NULL,
  PRIMARY KEY (unit_id, barcode)
);
CREATE INDEX IF NOT EXISTS ix_item_barcodes_item ON item_barcodes (item_id);
