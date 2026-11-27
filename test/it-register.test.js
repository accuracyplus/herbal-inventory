/**
 * The IT asset register (Design Guide D-086; docs/it-assets.md): kinds, who sees what and what it
 * costs, hand-overs with condition and photos, licence seats, exit clearance from HiFive ID's
 * leaving dates, IT and HR requests, spares, and the lines on Today. Equipment is untouched.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { HP, call, defaultRoster, hfidToken, jpegBytes, testEnv, upload } from './helpers/http.js';

const IT = { id: 'p-it', code: 'APIT01', name: 'Ramesh IT' };
const HR = { id: 'p-hr', code: 'APHR01', name: 'Hema HR' };
const token = (p) => hfidToken({ sub: `hf-${p.id}`, emp_code: p.code, name: p.name, role: 'employee', entity: 'Herbal Park' });

function setup() {
  const roster = [
    ...defaultRoster(),
    { employee_code: IT.code, full_name: IT.name, entity: 'Herbal Park', start_date: '2024-01-01', status: 'active' },
    { employee_code: HR.code, full_name: HR.name, entity: 'Herbal Park', start_date: '2024-01-01', status: 'active' },
    { employee_code: 'APLV01', full_name: 'Leela Leaving', entity: 'Herbal Park', start_date: '2024-01-01', status: 'active', end_date: null },
  ];
  const env = testEnv({ roster });
  const add = (p, roles) => {
    env.DB.db.prepare(`INSERT INTO staff (id, code, full_name, group_admin, active) VALUES (?,?,?,0,1)`).run(p.id, p.code, p.name);
    env.DB.db.prepare(`INSERT INTO staff_units (staff_id, unit_id, roles, stores, active) VALUES (?,?,?,NULL,1)`).run(p.id, HP, JSON.stringify(roles));
  };
  add(IT, ['IT']);
  add(HR, ['HR']);
  const as = (p) => ({ token: token(p) });
  return { env, roster, as };
}

const device = { kind: 'DEVICE', tag: 'it-001', name: 'Laptop, Dell Latitude', category: 'Laptop', serialNo: 'DL-77', cost: 3200, condition: 'NEW' };

test('IT adds devices, SIMs and licences; SIM digits and licence keys are refused', async () => {
  const { env, as } = setup();
  await call(env, 'PUT', '/api/settings', { as: 'admin', body: { 'assets.on': 'on' } });
  const d = await call(env, 'POST', '/api/assets', { ...as(IT), body: device });
  assert.equal(d.status, 201, JSON.stringify(d.body));
  const one = (await call(env, 'GET', `/api/assets/${d.body.id}`, as(IT))).body;
  assert.equal(one.kind, 'DEVICE');
  assert.equal(one.state, 'IN_STOCK');
  assert.equal(one.tag, 'IT-001');
  assert.equal(one.cost, 3200, 'IT sees the price');

  const sim = (digits) => call(env, 'POST', '/api/assets', { ...as(IT), body: { kind: 'SIM', tag: `SIM-${digits}`, name: 'Data SIM', simLast4: digits } });
  assert.equal((await sim('0501234567')).body.error.code, 'SIM_DIGITS', 'never the whole number');
  assert.equal((await sim('12')).body.error.code, 'SIM_DIGITS');
  assert.equal((await sim('4567')).status, 201);

  const lic = (notes) => call(env, 'POST', '/api/assets', { ...as(IT), body: { kind: 'LICENCE', tag: 'LIC-1', name: 'Microsoft 365 Business Standard', seats: 2, renewsOn: '2027-01-31', notes } });
  assert.equal((await lic('Key ABCDE-FGHIJ-KLMNO-PQRST-UVWXY')).body.error.code, 'NO_KEYS');
  assert.equal((await lic('Bought through the reseller')).status, 201);

  // Equipment is the store's, IT's kinds are IT's: neither role adds the other's.
  assert.equal((await call(env, 'POST', '/api/assets', { as: 'keeper', body: device })).status, 403);
  assert.equal((await call(env, 'POST', '/api/assets', { ...as(IT), body: { tag: 'EQ-1', name: 'Steamer' } })).status, 403);
});

test('who sees IT items, and their prices: IT, HR and the directors only', async () => {
  const { env, as } = setup();
  await call(env, 'PUT', '/api/settings', { as: 'admin', body: { 'assets.on': 'on' } });
  const d = (await call(env, 'POST', '/api/assets', { ...as(IT), body: device })).body;
  await call(env, 'POST', '/api/assets', { as: 'keeper', body: { tag: 'EQ-1', name: 'Steamer', cost: 900 } });
  const list = async (who) => (await call(env, 'GET', '/api/assets', who)).body;
  for (const who of ['staff', 'keeper', 'buyer']) {
    assert.deepEqual((await list({ as: who })).map((a) => a.tag), ['EQ-1'], `${who} sees equipment only`);
    assert.equal((await call(env, 'GET', `/api/assets/${d.id}`, { as: who })).status, 404);
  }
  const m = (await list({ as: 'manager' })).find((a) => a.tag === 'IT-001');
  assert.ok(m, 'the manager sees the IT register');
  assert.equal(m.cost, undefined, 'but not what IT costs');
  assert.equal((await list(as(HR))).find((a) => a.tag === 'IT-001').cost, 3200, 'HR sees the price');
  assert.equal((await list({ as: 'admin' })).find((a) => a.tag === 'IT-001').cost, 3200, 'a director (group) sees the price');
  assert.deepEqual((await call(env, 'GET', '/api/assets?kind=equipment', { as: 'manager' })).body.map((a) => a.tag), ['EQ-1'], 'the equipment view stays equipment');
  // A manager's edit cannot set or wipe a price they cannot see.
  const e = await call(env, 'PUT', `/api/assets/${d.id}`, { as: 'admin', body: { ...device, name: 'Laptop, renamed', cost: 1 } });
  assert.ok(e.status < 300, JSON.stringify(e.body));
});

test('hand-overs: issued with its condition, taken back compared, photos kept; the state follows', async () => {
  const { env, as } = setup();
  await call(env, 'PUT', '/api/settings', { as: 'admin', body: { 'assets.on': 'on' } });
  const d = (await call(env, 'POST', '/api/assets', { ...as(IT), body: device })).body;
  const ho = (body) => call(env, 'POST', `/api/assets/${d.id}/handover`, { ...as(IT), body });
  assert.equal((await ho({ action: 'ISSUE', toCode: 'HPNEW2' })).body.error.code, 'CONDITION_REQUIRED');
  assert.equal((await ho({ action: 'ISSUE', toCode: 'NOBODY', condition: 'GOOD' })).body.error.code, 'NOT_IN_HFID');
  const issued = await ho({ action: 'ISSUE', toCode: 'hpnew2', condition: 'GOOD' });
  assert.equal(issued.status, 201, JSON.stringify(issued.body));
  let a = (await call(env, 'GET', `/api/assets/${d.id}`, as(IT))).body;
  assert.equal(a.state, 'ASSIGNED');
  assert.equal(a.holder_name, 'Nisha Nair');
  assert.equal((await ho({ action: 'ISSUE', toCode: 'HPNEW1', condition: 'GOOD' })).body.error.code, 'NOT_NOW', 'take it back first');
  const photo = await upload(env, `/api/handovers/${issued.body.handoverId}/photos`, { token: as(IT).token, bytes: jpegBytes(), name: 'front.jpg', type: 'image/jpeg' });
  assert.equal(photo.status, 201, JSON.stringify(photo.body));
  const pdf = await upload(env, `/api/handovers/${issued.body.handoverId}/photos`, { token: as(IT).token });
  assert.equal(pdf.status, 422, 'a photo is a picture');
  assert.equal((await ho({ action: 'RETURN', condition: 'DAMAGED' })).body.error.code, 'NOTE_REQUIRED');
  assert.equal((await ho({ action: 'RETURN', condition: 'FAIR', note: 'Scratched lid' })).status, 201);
  a = (await call(env, 'GET', `/api/assets/${d.id}`, as(IT))).body;
  assert.equal(a.state, 'IN_STOCK');
  assert.equal(a.holder_code, null);
  assert.deepEqual(a.handovers.map((h) => [h.action, h.condition]), [['RETURN', 'FAIR'], ['ISSUE', 'GOOD']]);
  assert.equal(a.handovers[1].photos.length, 1);
  // The photo is for the people who see the IT register.
  assert.equal((await call(env, 'GET', `/api/files/${photo.body.id}`, { as: 'keeper' })).status, 403);
  assert.equal((await call(env, 'GET', `/api/files/${photo.body.id}`, { as: 'manager' })).status, 200);
  // Repair and retire.
  assert.equal((await ho({ action: 'REPAIR_OUT' })).status, 201);
  assert.equal((await ho({ action: 'ISSUE', toCode: 'HPNEW2', condition: 'GOOD' })).body.error.code, 'NOT_NOW');
  assert.equal((await ho({ action: 'REPAIR_BACK', condition: 'GOOD' })).status, 201);
  assert.equal((await ho({ action: 'RETIRE' })).status, 201);
  assert.equal((await call(env, 'GET', `/api/assets/${d.id}`, as(IT))).body.status, 'RETIRED');
  // The store does not hand IT things over.
  assert.equal((await call(env, 'POST', `/api/assets/${d.id}/handover`, { as: 'keeper', body: { action: 'IDLE' } })).status, 403);
});

test('licence seats: given to people up to the number bought, then a shortage', async () => {
  const { env, as } = setup();
  await call(env, 'PUT', '/api/settings', { as: 'admin', body: { 'assets.on': 'on' } });
  const l = (await call(env, 'POST', '/api/assets', { ...as(IT), body: { kind: 'LICENCE', tag: 'LIC-1', name: 'Microsoft 365', seats: 2, renewsOn: '2026-12-01' } })).body;
  const seat = (code) => call(env, 'POST', `/api/assets/${l.id}/seats`, { ...as(IT), body: { code } });
  assert.equal((await seat('HPNEW1')).status, 201);
  assert.equal((await seat('HPNEW1')).body.error.code, 'ALREADY_HOLDS');
  assert.equal((await seat('HPNEW2')).status, 201);
  assert.equal((await seat(IT.code)).body.error.code, 'NO_SEAT');
  const waiting = (await call(env, 'GET', '/api/today', as(IT))).body.waiting.map((w) => w.key);
  assert.ok(waiting.includes('it-seats'), 'a full licence shows on Today');
  const a = (await call(env, 'GET', `/api/assets/${l.id}`, as(IT))).body;
  assert.equal(a.seats_used, 2);
  assert.equal((await call(env, 'POST', `/api/assets/${l.id}/seats/${a.seats[0].id}/end`, { ...as(IT), body: {} })).status, 200);
  assert.equal((await seat(IT.code)).status, 201);
  assert.equal((await call(env, 'PUT', `/api/assets/${l.id}`, { ...as(IT), body: { tag: 'LIC-1', name: 'Microsoft 365', seats: 1 } })).body.error.code, 'SEATS_IN_USE');
});

test('exit clearance: whoever HiFive ID says has left still holding something, taken back with the condition compared', async () => {
  const { env, roster, as } = setup();
  await call(env, 'PUT', '/api/settings', { as: 'admin', body: { 'assets.on': 'on' } });
  const d = (await call(env, 'POST', '/api/assets', { ...as(IT), body: device })).body;
  const l = (await call(env, 'POST', '/api/assets', { ...as(IT), body: { kind: 'LICENCE', tag: 'LIC-1', name: 'Microsoft 365', seats: 5 } })).body;
  assert.equal((await call(env, 'POST', `/api/assets/${d.id}/handover`, { ...as(IT), body: { action: 'ISSUE', toCode: 'APLV01', condition: 'GOOD' } })).status, 201);
  assert.equal((await call(env, 'POST', `/api/assets/${l.id}/seats`, { ...as(IT), body: { code: 'APLV01' } })).status, 201);
  assert.deepEqual((await call(env, 'GET', '/api/it/clearance', as(IT))).body, [], 'still working: nothing to clear');
  roster.find((r) => r.employee_code === 'APLV01').end_date = '2026-01-31';
  const c = (await call(env, 'GET', '/api/it/clearance', as(IT))).body;
  assert.equal(c.length, 1);
  assert.equal(c[0].name, 'Leela Leaving');
  assert.equal(c[0].left, true);
  assert.equal(c[0].items[0].issued_condition, 'GOOD');
  assert.equal(c[0].seats.length, 1);
  assert.equal((await call(env, 'GET', '/api/it/clearance', { as: 'manager' })).status, 403, 'clearance is IT’s');
  assert.equal((await call(env, 'POST', `/api/assets/${d.id}/handover`, { ...as(IT), body: { action: 'RETURN', condition: 'GOOD', clearance: true } })).status, 201);
  assert.equal((await call(env, 'POST', `/api/assets/${l.id}/seats/${c[0].seats[0].seat_id}/end`, { ...as(IT), body: { clearance: true } })).status, 200);
  assert.deepEqual((await call(env, 'GET', '/api/it/clearance', as(IT))).body, []);
  const h = (await call(env, 'GET', `/api/assets/${d.id}`, as(IT))).body.handovers[0];
  assert.equal(h.clearance, 1);
  assert.equal(h.from_name, 'Leela Leaving');
});

const ACC = { id: 'p-acc', code: 'APAC01', name: 'Anil Accounts' };
const HEAD = { emp_code: 'HPM001', name: 'Maya Manager' };   // the default manager, as HiFive ID's unit head

/** The two-step set-up (Sinu, 27 Nov 2026): Accounts seated, and the HiFive ID link for unit heads. */
function twoStep(contacts = { 'Herbal Park': [HEAD] }) {
  const s = setup();
  s.env.DB.db.prepare(`INSERT INTO staff (id, code, full_name, group_admin, active) VALUES (?,?,?,0,1)`).run(ACC.id, ACC.code, ACC.name);
  s.env.DB.db.prepare(`INSERT INTO staff_units (staff_id, unit_id, roles, stores, active) VALUES (?,?,?,NULL,1)`).run(ACC.id, HP, JSON.stringify(['ACCOUNTS']));
  s.env.HFID_CONTACTS_TOKEN = 'hfid_svc_test_contacts';
  s.env.facilityContacts = contacts;
  return s;
}
const raise = async (env, as) => {
  await call(env, 'PUT', '/api/settings', { as: 'admin', body: { 'assets.on': 'on' } });
  const p = await call(env, 'POST', '/api/it/requests', { ...as(IT), body: { kind: 'PURCHASE', title: '2 laptops', estimate: 6400 } });
  assert.equal(p.status, 201, JSON.stringify(p.body));
  return p.body.id;
};
const who = (w) => (typeof w === 'string' ? { as: w } : w);
const act = (env, id, action, w, note) => call(env, 'POST', `/api/it/requests/${id}/${action}`, { ...who(w), body: note ? { note } : {} });
const waits = async (env, w, key) => (await call(env, 'GET', '/api/today', who(w))).body.waiting.some((x) => x.key === key);

test('IT purchases: the facility unit head approves first, then Accounts, then IT buys', async () => {
  const { env, as } = twoStep();
  const id = await raise(env, as);
  assert.equal((await call(env, 'POST', '/api/it/requests', { ...as(HR), body: { kind: 'PURCHASE', title: 'x' } })).status, 403, 'HR does not buy IT');
  assert.equal((await act(env, id, 'approve', as(IT))).body.error.code, 'FOUR_EYES', 'IT does not approve its own spending');
  assert.equal((await act(env, id, 'approve', as(ACC))).body.error.code, 'NOT_UNIT_HEAD', 'Accounts does not take the first step');
  assert.equal((await act(env, id, 'approve', 'admin')).body.error.code, 'NOT_UNIT_HEAD', 'a unit administrator is not the unit head');
  assert.ok(await waits(env, 'manager', 'it-purchase-approve'), 'the unit head is told');
  assert.ok(!(await waits(env, 'admin', 'it-purchase-approve')), 'nobody else is');
  assert.ok(!(await waits(env, as(ACC), 'it-purchase-accounts')), 'Accounts waits for the unit head');

  const list = (await call(env, 'GET', '/api/it/requests', { as: 'manager' })).body;
  assert.deepEqual(list.unitHead.names, ['Maya Manager']);
  assert.equal(list.unitHead.you, true);
  const seen = list.rows[0];
  assert.equal(seen.status_label, 'Waiting for the unit head');
  assert.equal(seen.may_decide, true);
  assert.equal(seen.estimate, undefined, 'the unit head sees the request, not IT prices');
  assert.equal((await act(env, id, 'done', as(IT))).body.error.code, 'NOT_READY');
  assert.equal((await act(env, id, 'reject', 'manager')).body.error.code, 'NOTE_REQUIRED');

  assert.equal((await act(env, id, 'approve', 'manager', 'Yes, for the front desk')).status, 200);
  assert.equal((await act(env, id, 'approve', 'manager')).status, 403, 'the unit head cannot take the Accounts step');
  assert.equal((await act(env, id, 'done', as(IT))).body.error.code, 'NOT_READY', 'not bought before Accounts');
  assert.ok(await waits(env, as(ACC), 'it-purchase-accounts'), 'now Accounts is told');
  const forAccounts = (await call(env, 'GET', '/api/it/requests', as(ACC))).body.rows[0];
  assert.equal(forAccounts.status, 'HEAD_APPROVED');
  assert.equal(forAccounts.head_name, 'Maya Manager');
  assert.equal(forAccounts.estimate, 6400, 'Accounts sees the estimate');
  assert.equal(forAccounts.may_decide, true);
  assert.equal((await act(env, id, 'approve', as(ACC))).status, 200);
  assert.ok(await waits(env, as(IT), 'it-buy'));
  assert.equal((await act(env, id, 'done', as(IT), 'Ordered from Sharaf')).status, 200);
  const audit = env.DB.db.prepare(`SELECT action FROM audit_log WHERE action LIKE 'IT_REQUEST_%' ORDER BY at`).all().map((r) => r.action);
  assert.deepEqual(audit.slice(-3), ['IT_REQUEST_HEAD_APPROVE', 'IT_REQUEST_APPROVE', 'IT_REQUEST_DONE']);
});

test('IT purchases: turned down at either step, with a reason; withdrawn only by who raised it', async () => {
  const { env, as } = twoStep();
  const a = await raise(env, as);
  assert.equal((await act(env, a, 'reject', 'manager', 'Use the spare in the store')).status, 200);
  const row = (await call(env, 'GET', '/api/it/requests?status=closed', as(IT))).body.rows.find((r) => r.id === a);
  assert.equal(row.status, 'REJECTED');
  assert.equal(row.head_note, 'Use the spare in the store');
  const b = await raise(env, as);
  assert.equal((await act(env, b, 'approve', 'manager')).status, 200);
  assert.equal((await act(env, b, 'reject', as(ACC))).body.error.code, 'NOTE_REQUIRED');
  assert.equal((await act(env, b, 'reject', as(ACC), 'Not in this month’s budget')).status, 200);
  const c = await raise(env, as);
  assert.equal((await act(env, c, 'cancel', 'manager')).status, 403, 'the unit head does not withdraw the request of IT');
  assert.equal((await act(env, c, 'cancel', as(IT))).status, 200);
});

test('IT purchases: no link, no unit head in HiFive ID, or HiFive ID down: the step waits and says why', async () => {
  // No link set up: nobody can take the first step, and the list says so.
  const none = setup();
  const id = await raise(none.env, none.as);
  assert.equal((await act(none.env, id, 'approve', 'manager')).body.error.code, 'NO_HEAD_LINK');
  assert.equal((await call(none.env, 'GET', '/api/it/requests', none.as(IT))).body.unitHead.setUp, false);
  assert.ok(!(await waits(none.env, 'manager', 'it-purchase-approve')), 'no fallback approver');
  // Linked, but HiFive ID lists nobody for this facility.
  const empty = twoStep({ 'Herbal Valley': [{ emp_code: 'HVM001', name: 'Someone Else' }] });
  const id2 = await raise(empty.env, empty.as);
  assert.equal((await act(empty.env, id2, 'approve', 'manager')).body.error.code, 'NO_UNIT_HEAD');
  assert.deepEqual((await call(empty.env, 'GET', '/api/it/requests', empty.as(IT))).body.unitHead.names, []);
  // HiFive ID does not answer: refused, and the list carries the reason instead of an empty queue.
  const down = twoStep(500);
  const id3 = await raise(down.env, down.as);
  assert.equal((await act(down.env, id3, 'approve', 'manager')).body.error.code, 'HFID_CONTACTS');
  assert.match((await call(down.env, 'GET', '/api/it/requests', down.as(IT))).body.unitHead.error, /HiFive ID/);
});

test('IT purchases: the hub tells the unit head, found by employee code', async () => {
  const { env, as } = twoStep();
  await raise(env, as);
  const { pendingForStaff } = await import('../src/domain/pending.js');
  assert.ok((await pendingForStaff(env, 'HPM001')).some((w) => w.kind === 'inventory_it_purchase_approve'));
  assert.ok(!(await pendingForStaff(env, ACC.code)).some((w) => w.kind === 'inventory_it_purchase_approve'));
});

test('requests: HR asks IT for an email account, and sees no IT purchases', async () => {
  const { env, as } = setup();
  await call(env, 'PUT', '/api/settings', { as: 'admin', body: { 'assets.on': 'on' } });
  await call(env, 'POST', '/api/it/requests', { ...as(IT), body: { kind: 'PURCHASE', title: '2 laptops' } });
  const e = await call(env, 'POST', '/api/it/requests', { ...as(HR), body: { kind: 'EMAIL_ACCOUNT', forName: 'New Joiner', neededBy: '2026-12-01' } });
  assert.equal(e.status, 201, JSON.stringify(e.body));
  assert.ok((await call(env, 'GET', '/api/today', as(IT))).body.waiting.some((w) => w.key === 'it-email'));
  const hrSees = (await call(env, 'GET', '/api/it/requests', as(HR))).body.rows;
  assert.ok(hrSees.length && hrSees.every((r) => r.kind === 'EMAIL_ACCOUNT'), 'HR sees the email requests, not IT purchases');
  assert.equal((await call(env, 'POST', `/api/it/requests/${e.body.id}/done`, { ...as(IT), body: { note: 'new.joiner@apml.co' } })).status, 200);
});

test('spares: fewer devices in stock than the unit keeps shows as a shortage', async () => {
  const { env, as } = setup();
  await call(env, 'PUT', '/api/settings', { as: 'admin', body: { 'assets.on': 'on' } });
  assert.equal((await call(env, 'PUT', '/api/it/spares', { ...as(IT), body: { category: 'Laptop', min: 2 } })).status, 200);
  await call(env, 'POST', '/api/assets', { ...as(IT), body: device });
  const s = (await call(env, 'GET', '/api/it/spares', as(IT))).body;
  assert.deepEqual(s, [{ category: 'Laptop', min: 2, inStock: 1, short: 1 }]);
  assert.ok((await call(env, 'GET', '/api/today', as(IT))).body.waiting.some((w) => w.key === 'it-short'));
  assert.equal((await call(env, 'PUT', '/api/it/spares', { as: 'keeper', body: { category: 'Laptop', min: 1 } })).status, 403);
});
