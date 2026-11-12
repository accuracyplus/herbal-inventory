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
  { level: 6, file: 'migrations/0005_deliveries.sql', table: 'supplier_item_map', column: 'factor' },
  { level: 7, file: 'migrations/0006_services.sql', table: 'service_record_lines', column: 'std_qty' },
  { level: 8, file: 'migrations/0007_service_link.sql', table: 'service_inbox', column: 'decision_note' },
  { level: 9, file: 'migrations/0008_supplier_depth.sql', table: 'po_emails', column: 'pdf_sha256' },
  { level: 10, file: 'migrations/0009_lab_lots.sql', table: 'lot_openings', column: 'close_reason' },
  { level: 11, file: 'migrations/0010_enterprise.sql', table: 'closed_periods', column: 'note' },
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
