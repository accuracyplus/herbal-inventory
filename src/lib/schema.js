/**
 * Which schema level the database is at, for /version — so a Worker running ahead of its
 * database shows in one curl. Each level names a table or column a migration adds; add a line
 * here with every migration file.
 */

export const LEVELS = [
  { level: 1, file: 'schema.sql', table: 'legacy_movements', column: 'remarks' },
  { level: 2, file: 'migrations/0001_departments_and_people.sql', table: 'movements', column: 'department_id' },
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
