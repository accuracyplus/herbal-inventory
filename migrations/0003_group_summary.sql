-- Who may read the monthly summary across units without being a group administrator: directors.
-- Set by a group administrator on the People screen. It shows counts and totals per unit only,
-- and gives no other access; the person still needs a seat in a unit to sign in.

ALTER TABLE staff ADD COLUMN group_summary INTEGER NOT NULL DEFAULT 0;
