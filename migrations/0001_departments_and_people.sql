-- Consumption points: departments, the room's department, and who stock was used by.
--
-- A department groups rooms and benches: Spa and Front office at Herbal Park, Haematology and
-- Biochemistry in the lab. The ledger keeps the person and the department as they stood when the
-- stock was used, so moving a room to another department later does not rewrite past figures.

CREATE TABLE IF NOT EXISTS departments (
  id          TEXT PRIMARY KEY,
  unit_id     TEXT NOT NULL REFERENCES units(id),
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT,
  updated_by  TEXT,
  UNIQUE (unit_id, code)
);

ALTER TABLE areas ADD COLUMN department_id TEXT REFERENCES departments(id);
CREATE INDEX IF NOT EXISTS ix_areas_department ON areas (department_id);

ALTER TABLE movements ADD COLUMN person_id TEXT REFERENCES staff(id);
ALTER TABLE movements ADD COLUMN person_name TEXT;
ALTER TABLE movements ADD COLUMN department_id TEXT REFERENCES departments(id);
CREATE INDEX IF NOT EXISTS ix_mov_person ON movements (unit_id, person_id, at);
CREATE INDEX IF NOT EXISTS ix_mov_department ON movements (unit_id, department_id, at);
