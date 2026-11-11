import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA, call, HV, makeItem, receive, S, testEnv } from './helpers/http.js';

const send = (env, kind, headers, rows, { as = 'admin', apply = false, unit } = {}) => call(env, 'POST', `/api/bulk/${kind}`, { as, unit, body: { headers, rows, dryRun: !apply } });
const item = (env, code) => env.DB.db.prepare(`SELECT * FROM items WHERE unit_id = 'u-hp' AND code = ?`).get(code);
const count = (env, table) => env.DB.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
const H = ['Code', 'Name', 'Category', 'Unit', 'Barcode', 'Tracks expiry', 'Linen', 'Supplier', 'Cost', 'Notes', 'MAIN reorder', 'MAIN critical', 'MAIN top up'];

// ── Items ────────────────────────────────────────────────────────────────────

test('items: the check reports adds, changes, unchanged and problems, and changes nothing', async () => {
  const env = testEnv();
  await makeItem(env, { code: 'OIL1', name: 'Old name', category: 'Oils' });
  await makeItem(env, { code: 'OIL2', name: 'Same', category: 'Oils' });
  const r = await send(env, 'items', ['Code', 'Name', 'Category'], [
    ['OIL1', 'New name', null], ['oil2', 'Same', 'Oils'], ['NEW1', 'Kizhi', 'Herbs'], ['NEW2', null, null],
  ]);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.summary, { add: 1, change: 1, same: 1, problems: 1 });
  assert.deepEqual(r.body.rows.map((x) => [x.row, x.key, x.action]), [[2, 'OIL1', 'change'], [3, 'OIL2', 'same'], [4, 'NEW1', 'add'], [5, 'NEW2', 'problem']]);
  assert.deepEqual(r.body.rows[0].changes, ['Name: Old name → New name']);
  assert.match(r.body.rows[3].problems[0], /needs a name/);
  assert.equal(item(env, 'OIL1').name, 'Old name');
  assert.equal(count(env, 'items'), 2);
});

test('items: applying is all or nothing', async () => {
  const env = testEnv();
  const bad = await send(env, 'items', ['Code', 'Name'], [['A1', 'Fine'], ['A2', null]], { apply: true });
  assert.equal(bad.status, 422);
  assert.equal(bad.body.error.code, 'BULK_PROBLEMS');
  assert.equal(bad.body.error.details.report.summary.problems, 1);
  assert.equal(count(env, 'items'), 0);
  const ok = await send(env, 'items', ['Code', 'Name'], [['A1', 'Fine'], ['A2', 'Also fine']], { apply: true });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.applied, true);
  assert.equal(count(env, 'items'), 2);
});

test('items: a new item arrives whole, with its levels, supplier and cost', async () => {
  const env = testEnv();
  await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name: 'Kerala Traders' } });
  const r = await send(env, 'items', H, [['thai-1', 'Dhanwantharam', 'Oils', 'bottle', '6291041500213', 'Yes', 'no', 'kerala traders', '12.5', 'Keep cool', 10, 3, 40]], { apply: true });
  assert.equal(r.status, 200);
  const it = item(env, 'THAI-1');
  assert.deepEqual([it.name, it.category, it.uom, it.barcode, it.tracks_expiry, it.is_linen, it.avg_cost, it.last_cost, it.notes, it.active],
    ['Dhanwantharam', 'Oils', 'bottle', '6291041500213', 1, 0, 12.5, 12.5, 'Keep cool', 1]);
  assert.ok(it.supplier_id);
  const lv = env.DB.db.prepare(`SELECT reorder, critical, par FROM item_levels WHERE item_id = ? AND store_id = ?`).get(it.id, S.main);
  assert.deepEqual({ ...lv }, { reorder: 10, critical: 3, par: 40 });
  // The app sees it like any other item.
  const stock = await call(env, 'GET', '/api/stock', { as: 'staff' });
  assert.ok(stock.body.items.some((i) => i.code === 'THAI-1'));
});

test('items: a blank cell leaves the field alone, and cost on an existing item is the last price only', async () => {
  const env = testEnv();
  const id = await makeItem(env, { code: 'OIL1', name: 'Oil', category: 'Oils', barcode: '111', notes: 'Old note' });
  await receive(env, id, 10, { unitCost: 4 });
  const r = await send(env, 'items', ['Code', 'Name', 'Category', 'Barcode', 'Cost', 'Notes'], [['OIL1', null, 'Massage oils', null, 9, null]], { apply: true });
  assert.equal(r.status, 200);
  const it = item(env, 'OIL1');
  assert.deepEqual([it.name, it.category, it.barcode, it.notes, it.avg_cost, it.last_cost], ['Oil', 'Massage oils', '111', 'Old note', 4, 9]);
});

test('items: what Excel does to a barcode is caught, not saved', async () => {
  const env = testEnv();
  const r = await send(env, 'items', ['Code', 'Name', 'Barcode'], [
    ['A1', 'Rounded', 6291041500213123456], ['A2', 'Scientific', '6.29104E+12'], ['A3', 'Kept', 6291041500213], ['A4', 'Lost zero', 12345678905], ['A5', 'Decimal', 12.5],
  ]);
  const by = Object.fromEntries(r.body.rows.map((x) => [x.key, x]));
  assert.match(by.A1.problems[0], /rounded/);
  assert.match(by.A2.problems[0], /scientific notation/);
  assert.equal(by.A3.action, 'add');
  assert.equal(by.A4.action, 'add');
  assert.match(by.A4.notes[0], /starting with 0/);
  assert.equal(by.A5.action, 'problem');
  const ok = await send(env, 'items', ['Code', 'Name', 'Barcode'], [['A3', 'Kept', 6291041500213]], { apply: true });
  assert.equal(ok.status, 200);
  assert.equal(item(env, 'A3').barcode, '6291041500213');
});

test('items: the same code or barcode twice, a barcode in use, an unknown supplier, linen with expiry', async () => {
  const env = testEnv();
  const id = await makeItem(env, { code: 'HAS', name: 'Has it', barcode: '555' });
  await call(env, 'POST', `/api/items/${id}/barcodes`, { as: 'keeper', body: { barcode: '556' } });
  const r = await send(env, 'items', ['Code', 'Name', 'Barcode', 'Supplier', 'Linen', 'Tracks expiry'], [
    ['A1', 'One', '777', null, null, null], ['a1', 'One again', null, null, null, null], ['A2', 'Two', '777', null, null, null],
    ['A3', 'Three', '555', null, null, null], ['A4', 'Four', '556', null, null, null], ['A5', 'Five', null, 'Nobody Ltd', null, null],
    ['A6', 'Six', null, null, 'yes', 'yes'], ['A7', 'Seven', null, null, 'maybe', null], ['A 8', 'Eight', null, null, null, null],
  ]);
  const p = r.body.rows.map((x) => x.problems[0] || '');
  assert.equal(p[0], '');
  assert.match(p[1], /Row 2 has the same code/);
  assert.match(p[2], /Row 2 has the same barcode/);
  assert.match(p[3], /already belongs to Has it/);
  assert.match(p[4], /already belongs to Has it/);
  assert.match(p[5], /“Nobody Ltd” is not in this unit/);
  assert.match(p[6], /Linen does not expire/);
  assert.match(p[7], /yes or no/);
  assert.match(p[8], /letters, numbers/);
});

test('items: expiry tracking or linen cannot be switched in bulk on an item that holds stock', async () => {
  const env = testEnv();
  const id = await makeItem(env, { code: 'OIL1', name: 'Oil' });
  const free = await makeItem(env, { code: 'OIL2', name: 'Oil two' });
  await receive(env, id, 5);
  const r = await send(env, 'items', ['Code', 'Tracks expiry'], [['OIL1', 'yes'], ['OIL2', 'yes']]);
  assert.match(r.body.rows[0].problems[0], /holds stock/);
  assert.equal(r.body.rows[1].action, 'change');
  await send(env, 'items', ['Code', 'Tracks expiry'], [['OIL2', 'yes']], { apply: true });
  assert.equal(env.DB.db.prepare(`SELECT tracks_expiry FROM items WHERE id = ?`).get(free).tracks_expiry, 1);
  assert.equal(count(env, 'batches'), 0, 'bulk upload never writes batches');
});

test('items: levels keep what is blank, are checked, and three zeros remove them', async () => {
  const env = testEnv();
  const id = await makeItem(env, { code: 'OIL1', name: 'Oil', levels: [{ storeId: S.main, reorder: 10, critical: 3, par: 40 }] });
  const lv = () => env.DB.db.prepare(`SELECT reorder, critical, par FROM item_levels WHERE item_id = ? AND store_id = ?`).get(id, S.main);
  const cols = ['Code', 'MAIN reorder', 'MAIN critical', 'MAIN top up'];
  const bad = await send(env, 'items', cols, [['OIL1', 5, 8, null]]);
  assert.match(bad.body.rows[0].problems[0], /critical level should be at or below/);
  const r = await send(env, 'items', cols, [['OIL1', 12, null, null]], { apply: true });
  assert.deepEqual(r.body.rows[0].changes, ['MAIN levels: 10/3/40 → 12/3/40']);
  assert.deepEqual({ ...lv() }, { reorder: 12, critical: 3, par: 40 });
  await send(env, 'items', cols, [['OIL1', 0, 0, 0]], { apply: true });
  assert.equal(lv(), undefined);
});

test('headings: any case, known other names, unknown ones listed, and a sheet with no code column refused', async () => {
  const env = testEnv();
  const r = await send(env, 'items', ['CODE', ' name ', 'UOM', 'Colour', 'Unit cost'], [['A1', 'One', 'kg', 'red', 3]], { apply: true });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.ignored, ['Colour']);
  assert.deepEqual([item(env, 'A1').uom, item(env, 'A1').last_cost], ['kg', 3]);
  const none = await send(env, 'items', ['Name', 'Category'], [['One', 'Oils']]);
  assert.equal(none.status, 422);
  assert.match(none.body.error.message, /no “Code” column/);
  assert.equal((await send(env, 'items', ['Code', 'Code'], [['A', 'B']])).status, 422);
  assert.equal((await send(env, 'items', ['Code', 'Name'], [[null, null], []])).body.error.code, 'EMPTY_FILE');
});

test('who may: items for those who keep the item list, suppliers for purchasing, rooms for administrators', async () => {
  const env = testEnv();
  const tries = { items: { manager: 200, admin: 200, keeper: 403, buyer: 403, staff: 403, viewer: 403 },
    suppliers: { buyer: 200, manager: 200, keeper: 403, staff: 403 }, areas: { admin: 200, manager: 403, keeper: 403 } };
  const sheet = { items: [['Code', 'Name'], [['Z1', 'Z']]], suppliers: [['Name'], [['Z Ltd']]], areas: [['Code', 'Name'], [['Z1', 'Z room']]] };
  for (const [kind, who] of Object.entries(tries)) {
    for (const [as, status] of Object.entries(who)) {
      assert.equal((await send(env, kind, ...sheet[kind], { as })).status, status, `${kind} check as ${as}`);
      assert.equal((await call(env, 'GET', `/api/bulk/${kind}/template`, { as })).status, status, `${kind} template as ${as}`);
    }
  }
  assert.equal((await send(env, 'people', ['Code'], [['x']])).status, 404);
  // A viewer who is a director elsewhere still cannot write.
  assert.equal((await send(env, 'items', ['Code', 'Name'], [['Z1', 'Z']], { as: 'viewer', apply: true })).status, 403);
});

test('units: an upload lands in the unit it was sent from, and codes do not cross', async () => {
  const env = testEnv();
  await makeItem(env, { code: 'OIL1', name: 'Park oil' });
  const r = await send(env, 'items', ['Code', 'Name'], [['OIL1', 'Valley oil']], { unit: HV, apply: true });
  assert.equal(r.body.summary.add, 1);
  assert.equal(item(env, 'OIL1').name, 'Park oil');
  assert.equal(env.DB.db.prepare(`SELECT name FROM items WHERE unit_id = ? AND code = 'OIL1'`).get(HV).name, 'Valley oil');
});

test('a full item list goes in at once, and a file past the limit is refused', async () => {
  const env = testEnv();
  const rows = Array.from({ length: 600 }, (_, i) => [`IT${String(i).padStart(4, '0')}`, `Item ${i}`, 'General', 'pcs', `62910000${String(i).padStart(5, '0')}`, null, null, null, 1, null, 5, 1, 20]);
  const r = await send(env, 'items', H, rows, { apply: true });
  assert.equal(r.status, 200);
  assert.equal(count(env, 'items'), 600);
  assert.equal(count(env, 'item_levels'), 600);
  const again = await send(env, 'items', H, rows, { apply: true });
  assert.equal(again.body.error.code, 'NOTHING');
  const over = await send(env, 'items', ['Code', 'Name'], Array.from({ length: 1001 }, (_, i) => [`X${i}`, 'x']));
  assert.equal(over.body.error.code, 'TOO_MANY');
});

test('the activity log has each item, and the upload as a whole', async () => {
  const env = testEnv();
  await makeItem(env, { code: 'OIL1', name: 'Oil' });
  await send(env, 'items', ['Code', 'Name'], [['OIL1', 'Oil renamed'], ['NEW1', 'New']], { as: 'manager', apply: true });
  const log = (await call(env, 'GET', '/api/audit', { as: 'admin' })).body;
  assert.match(log.find((x) => x.action === 'ITEM_EDIT' && x.subject === 'OIL1').detail, /bulk upload\): Name: Oil → Oil renamed/);
  assert.ok(log.some((x) => x.action === 'ITEM_CREATE' && x.subject === 'NEW1' && x.actor_name === 'Maya Manager'));
  assert.equal(log.find((x) => x.action === 'BULK_UPLOAD').detail, '1 added, 1 changed, 0 unchanged');
});

// ── Suppliers ────────────────────────────────────────────────────────────────

test('suppliers: added and changed by name, with phone and TRN kept as text', async () => {
  const env = testEnv();
  await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name: 'Kerala Traders', phone: '+971500000000' } });
  const r = await send(env, 'suppliers', ['Name', 'Contact', 'Phone', 'Email', 'TRN', 'Payment terms', 'Lead days'], [
    ['kerala traders', 'Anil', null, 'orders@example.com', '100234567800003', '30 days', 7],
    ['Gulf Linen', null, '0501234567', null, null, null, null],
  ], { as: 'buyer', apply: true });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.summary, { add: 1, change: 1, same: 0, problems: 0 });
  const k = env.DB.db.prepare(`SELECT * FROM suppliers WHERE name = 'Kerala Traders'`).get();
  assert.deepEqual([k.contact, k.phone, k.email, k.trn, k.terms, k.lead_days], ['Anil', '+971500000000', 'orders@example.com', '100234567800003', '30 days', 7]);
  assert.equal(env.DB.db.prepare(`SELECT phone FROM suppliers WHERE name = 'Gulf Linen'`).get().phone, '0501234567');
});

test('suppliers: a rounded TRN, a bad email and a repeated name are problems', async () => {
  const env = testEnv();
  const r = await send(env, 'suppliers', ['Name', 'Email', 'TRN', 'Lead days', 'Phone'], [
    ['A Ltd', 'not-an-email', null, null, null], ['B Ltd', null, 1002345678000031, null, null], ['a ltd', null, null, null, null], ['C Ltd', null, null, 2.5, 971500000000],
  ]);
  assert.match(r.body.rows[0].problems[0], /email/);
  assert.match(r.body.rows[1].problems[0], /rounded/);
  assert.match(r.body.rows[2].problems[0], /same name/);
  assert.match(r.body.rows[3].problems[0], /whole number/);
  assert.match(r.body.rows[3].notes[0], /lost a \+/);
});

// ── Rooms and areas ──────────────────────────────────────────────────────────

test('rooms: added with kind and department by name; a unit with departments needs one on a new room', async () => {
  const env = testEnv();
  const free = await send(env, 'areas', ['Code', 'Name', 'Kind'], [['r3', 'Treatment room 3', null], ['B1', 'Bench 1', 'bench']], { apply: true });
  assert.equal(free.status, 200);
  assert.equal(env.DB.db.prepare(`SELECT kind FROM areas WHERE code = 'B1'`).get().kind, 'BENCH');
  const spa = (await call(env, 'POST', '/api/departments', { body: { code: 'SPA', name: 'Spa' } })).body.id;
  const r = await send(env, 'areas', ['Code', 'Name', 'Kind', 'Department'], [
    ['R4', 'Treatment room 4', 'Treatment room', 'spa'], ['R5', 'Treatment room 5', null, null], ['R6', 'Six', 'Cupboard', 'Spa'], ['R7', 'Seven', null, 'Lab'], ['R1', null, null, 'Spa'],
  ]);
  assert.deepEqual(r.body.rows.map((x) => x.action), ['add', 'problem', 'problem', 'problem', 'change']);
  assert.match(r.body.rows[1].problems[0], /which department/);
  assert.match(r.body.rows[2].problems[0], /“Cupboard” is not one of/);
  assert.match(r.body.rows[3].problems[0], /“Lab” is not in this unit/);
  assert.deepEqual(r.body.rows[4].changes, ['Department: empty → Spa']);
  await send(env, 'areas', ['Code', 'Department'], [['R1', 'Spa']], { apply: true });
  assert.equal(env.DB.db.prepare(`SELECT department_id FROM areas WHERE id = ?`).get(AREA.room1).department_id, spa);
});

// ── The template ─────────────────────────────────────────────────────────────

test('template: the unit\'s own stores as level columns, text columns marked, and what exists filled in', async () => {
  const env = testEnv();
  await makeItem(env, { code: 'OIL1', name: 'Oil', barcode: '0123456789012', levels: [{ storeId: S.sub, reorder: 4, critical: 1, par: 12 }] });
  const t = (await call(env, 'GET', '/api/bulk/items/template', { as: 'manager' })).body;
  const heads = t.columns.map((c) => c.header);
  assert.deepEqual(heads.slice(-6), ['MAIN reorder', 'MAIN critical', 'MAIN top up', 'SUB reorder', 'SUB critical', 'SUB top up']);
  assert.deepEqual(t.columns.filter((c) => c.text).map((c) => c.header), ['Code', 'Barcode']);
  assert.equal(t.fileName, 'inventory-items-HP');
  const row = Object.fromEntries(heads.map((h, i) => [h, t.rows[0][i]]));
  assert.deepEqual([row.Code, row.Barcode, row['Tracks expiry'], row['SUB reorder'], row['MAIN reorder']], ['OIL1', '0123456789012', 'no', 4, null]);
  assert.deepEqual((await call(env, 'GET', '/api/bulk/suppliers/template', { as: 'buyer' })).body.columns.filter((c) => c.text).map((c) => c.header), ['Phone', 'TRN']);
});

test('template: sent straight back, it changes nothing', async () => {
  const env = testEnv();
  await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name: 'Kerala Traders' } });
  const sup = env.DB.db.prepare(`SELECT id FROM suppliers`).get().id;
  await makeItem(env, { code: 'OIL1', name: 'Oil', barcode: '0123456789012', supplierId: sup, unitCost: 5, tracksExpiry: true, levels: [{ storeId: S.main, reorder: 4, critical: 1, par: 12 }] });
  await makeItem(env, { code: 'TWL', name: 'Towel', isLinen: true });
  for (const kind of ['items', 'suppliers', 'areas']) {
    const t = (await call(env, 'GET', `/api/bulk/${kind}/template`)).body;
    const r = await send(env, kind, t.columns.map((c) => c.header), t.rows);
    assert.equal(r.status, 200, kind);
    assert.equal(r.body.summary.same, t.rows.length, kind);
    assert.deepEqual([r.body.summary.add, r.body.summary.change, r.body.summary.problems], [0, 0, 0], kind);
  }
});
