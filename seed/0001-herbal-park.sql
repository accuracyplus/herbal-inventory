-- Herbal Park, its two stores, and the first administrator.
--
--   npm run seed      (wrangler d1 execute hifive-inventory --remote --file=seed/0001-herbal-park.sql)
--
-- Run once, after schema.sql. Everything else — items, rooms, levels, opening stock and the old
-- app's history — comes in through Admin → Import, and people through Admin → People (or by
-- HiFive ID's "Can access", which gives STAFF at first sign-in; see HFID_GRANT_ROLE).
--
-- The unit's NAME must match the entity name HiFive ID uses ("Herbal Park"), because that is how
-- a first sign-in is placed in a unit. Change it here if HiFive ID spells it differently.
--
-- APML131 (Sinu Sureshan) is a group administrator: every unit, every role. The flag only works
-- while HiFive ID also says admin or hr for that account (src/lib/auth.js), so it cannot be
-- borrowed by an ordinary sign-in.

INSERT OR IGNORE INTO units (id, code, name, city, active, created_at, created_by)
VALUES ('u-herbal-park', 'HP', 'Herbal Park', 'Abu Dhabi', 1, datetime('now'), 'seed');

INSERT OR IGNORE INTO stores (id, unit_id, code, name, kind, sort, active, updated_at, updated_by) VALUES
  ('st-hp-main', 'u-herbal-park', 'MAIN', 'Main store', 'MAIN', 0, 1, datetime('now'), 'seed'),
  ('st-hp-spa',  'u-herbal-park', 'SPA',  'Spa store',  'SUB',  1, 1, datetime('now'), 'seed');

INSERT OR IGNORE INTO staff (id, code, full_name, group_admin, active, updated_at, updated_by)
VALUES ('p-apml131', 'APML131', 'Sinu Sureshan', 1, 1, datetime('now'), 'seed');

INSERT OR IGNORE INTO staff_units (staff_id, unit_id, roles, stores, active, updated_at, updated_by)
VALUES ('p-apml131', 'u-herbal-park', '["UNIT_ADMIN","MANAGER"]', NULL, 1, datetime('now'), 'seed');
