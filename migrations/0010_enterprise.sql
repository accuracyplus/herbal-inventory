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
