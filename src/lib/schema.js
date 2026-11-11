/**
 * Which schema level the database is at, for /version — so a Worker running ahead of its
 * database shows in one curl. Each level names a table or column a migration adds; add a line
 * here with every migration file.
 */

export const LEVELS = [
  { level: 1, file: 'schema.sql', table: 'legacy_movements', column: 'remarks' },
  { level: 2, file: 'migrations/0001_departments_and_people.sql', table: 'movements', column: 'department_id' },
  { level: 3, file: 'migrations/0002_custody.sql', table: 'custody', column: 'taken_qty' },
  { level: 4, file: 'migrations/0003_group_summary.sql', table: 'staff', column: 'group_summary' },
  { level: 5, file: 'migrations/0004_scanning.sql', table: 'item_barcodes', column: 'added_by' },
];

export const EXPECTED_LEVEL = LEVELS[LEVELS.length - 1].level;

async function present(env, { table, column }) {
  try {
    await env.DB.prepare(`SELECT ${column || '1'} FROM ${table} LIMIT 0`).all();
    return true;
  } catch {
    return false;
  }
}

export async function schemaStatus(env) {
  const applied = [];
  const missing = [];
  for (const l of LEVELS) {
    if (await present(env, l)) applied.push(l.level);
    else missing.push({ level: l.level, file: l.file });
  }
  return { ok: missing.length === 0, expected: EXPECTED_LEVEL, applied, missing };
}
