-- Services and their recipes (a bill of materials): what one Abhyanga, one Kizhi, or one lab test
-- normally uses. Recording a service takes its recipe off the shelf in one go.
--
-- A record keeps, line by line, what the recipe said at the time (std_qty) beside what was
-- actually used (qty) and what one cost then. Changing a recipe later does not rewrite the past,
-- and "actual against standard" is a sum over these lines.

CREATE TABLE IF NOT EXISTS services (
  id          TEXT PRIMARY KEY,
  unit_id     TEXT NOT NULL REFERENCES units(id),
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT,
  updated_by  TEXT,
  UNIQUE (unit_id, code)
);

CREATE TABLE IF NOT EXISTS service_items (
  service_id  TEXT NOT NULL REFERENCES services(id),
  item_id     TEXT NOT NULL REFERENCES items(id),
  qty         REAL NOT NULL CHECK (qty > 0),      -- for one service, in the item's own unit
  PRIMARY KEY (service_id, item_id)
);

CREATE TABLE IF NOT EXISTS service_records (
  id             TEXT PRIMARY KEY,
  unit_id        TEXT NOT NULL REFERENCES units(id),
  ref            TEXT NOT NULL,
  service_id     TEXT NOT NULL REFERENCES services(id),
  service_name   TEXT NOT NULL,
  times          INTEGER NOT NULL DEFAULT 1 CHECK (times > 0),
  store_id       TEXT NOT NULL REFERENCES stores(id),
  area_id        TEXT REFERENCES areas(id),
  department_id  TEXT REFERENCES departments(id),
  person_id      TEXT REFERENCES staff(id),
  person_name    TEXT,
  note           TEXT,
  std_value      REAL NOT NULL DEFAULT 0,
  actual_value   REAL NOT NULL DEFAULT 0,
  by_id          TEXT NOT NULL,
  by_name        TEXT NOT NULL,
  at             TEXT NOT NULL,
  UNIQUE (unit_id, ref)
);
CREATE INDEX IF NOT EXISTS ix_service_records ON service_records (unit_id, at DESC);
CREATE INDEX IF NOT EXISTS ix_service_records_person ON service_records (unit_id, person_id, at);

CREATE TABLE IF NOT EXISTS service_record_lines (
  id         TEXT PRIMARY KEY,
  record_id  TEXT NOT NULL REFERENCES service_records(id),
  item_id    TEXT NOT NULL REFERENCES items(id),
  std_qty    REAL NOT NULL DEFAULT 0 CHECK (std_qty >= 0),   -- the recipe, times how many were done
  qty        REAL NOT NULL DEFAULT 0 CHECK (qty >= 0),       -- what was used
  unit_cost  REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_service_record_lines ON service_record_lines (record_id);
