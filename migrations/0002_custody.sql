-- Stock somebody has taken and not yet accounted for.
--
-- One row per take (and per batch, for expiry items), so each carries its own age. It left the
-- shelf with a TAKE movement. It still belongs to the unit: it counts in stock value and average
-- cost. It becomes consumption only when recorded as used: an ISSUE movement with
-- from_state = 'custody', which does not touch the shelf again. A return is a RETURN movement.
--
-- batch_id has no foreign key: switching expiry tracking off drops the item's batches.

CREATE TABLE IF NOT EXISTS custody (
  id             TEXT PRIMARY KEY,
  unit_id        TEXT NOT NULL REFERENCES units(id),
  person_id      TEXT NOT NULL REFERENCES staff(id),
  person_name    TEXT NOT NULL,
  store_id       TEXT NOT NULL REFERENCES stores(id),
  item_id        TEXT NOT NULL REFERENCES items(id),
  batch_id       TEXT,
  area_id        TEXT REFERENCES areas(id),
  qty            REAL NOT NULL CHECK (qty >= 0),
  taken_qty      REAL NOT NULL CHECK (taken_qty > 0),
  unit_cost      REAL NOT NULL DEFAULT 0,
  taken_at       TEXT NOT NULL,
  taken_by       TEXT NOT NULL,
  taken_by_name  TEXT NOT NULL,
  doc_id         TEXT
);
CREATE INDEX IF NOT EXISTS ix_custody_person ON custody (unit_id, person_id, taken_at) WHERE qty > 0;
CREATE INDEX IF NOT EXISTS ix_custody_age ON custody (unit_id, taken_at) WHERE qty > 0;
CREATE INDEX IF NOT EXISTS ix_custody_stock ON custody (store_id, item_id) WHERE qty > 0;
