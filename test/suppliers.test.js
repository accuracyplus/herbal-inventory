/**
 * Supplier depth: what each supplier charged, how its deliveries went, and an approved order
 * sent to it as a PDF. Prices and the delivery record are read from approved deliveries and
 * the unit's own orders; nothing is typed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { call, deliver, download, HV, makeItem, S, testEnv } from './helpers/http.js';
import { bySupplier, judgeOrders } from '../src/domain/suppliers.js';
import { plain } from '../src/lib/pdf.js';

const supplier = async (env, name, extra = {}) => (await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name, ...extra } })).body.id;
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
const day = (n) => new Date(Date.now() + 4 * 3600e3 + n * 864e5).toISOString().slice(0, 10);
/** A delivery on the shelf, from a supplier, at a price, dated some days back. */
async function delivered(env, supplierId, itemId, unitCost, ago, extra = {}) {
  const r = await deliver(env, { storeId: S.main, supplierId, lines: [{ itemId, qty: extra.qty ?? 5, unitCost, noteQty: extra.noteQty }] });
  env.DB.db.prepare(`UPDATE receipts SET at = ? WHERE id = ?`).run(daysAgo(ago), r.id);
  return r;
}
/** An order taken to approved: the buyer writes and submits it, a manager approves. */
async function order(env, supplierId, lines, expectedDate) {
  const made = await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId, storeId: S.main, expectedDate, lines } });
  assert.equal(made.status, 201, JSON.stringify(made.body));
  await call(env, 'POST', `/api/pos/${made.body.id}/submit`, { as: 'buyer' });
  const ok = await call(env, 'POST', `/api/pos/${made.body.id}/approve`, { as: 'manager' });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  return made.body;
}

// ── Prices ───────────────────────────────────────────────────────────────────

test('prices: each supplier side by side, lowest first, with the price before and the lowest marked', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await supplier(env, 'Alpha Traders');
  const b = await supplier(env, 'Beta Supplies');
  await delivered(env, a, oil, 10, 40);
  await delivered(env, a, oil, 12, 10);
  await delivered(env, b, oil, 11, 20);

  const r = await call(env, 'GET', `/api/items/${oil}/prices`, { as: 'buyer' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.suppliers.map((s) => [s.name, s.last, s.before, s.change, s.lowest, s.deliveries]), [
    ['Beta Supplies', 11, null, null, true, 1],
    ['Alpha Traders', 12, 10, 2, false, 2],
  ]);
  assert.deepEqual(r.body.history.map((h) => [h.supplierName, h.unitCost]), [['Alpha Traders', 12], ['Beta Supplies', 11], ['Alpha Traders', 10]]);
});

test('prices: only what was approved counts, a line with no price is not a price, and no supplier is not a comparison', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await supplier(env, 'Alpha Traders');
  await delivered(env, a, oil, 10, 5);
  // Recorded but not approved: not on the shelf, so not a price yet.
  const waiting = await call(env, 'POST', '/api/receipts', { as: 'keeper', body: { storeId: S.main, supplierId: a, lines: [{ itemId: oil, qty: 1, unitCost: 99 }] } });
  assert.equal(waiting.body.status, 'PENDING');
  await deliver(env, { storeId: S.main, supplierId: a, lines: [{ itemId: oil, qty: 1, unitCost: 0 }] });
  await deliver(env, { storeId: S.main, lines: [{ itemId: oil, qty: 1, unitCost: 7 }] }); // a local purchase, no supplier recorded

  const r = (await call(env, 'GET', `/api/items/${oil}/prices`, { as: 'buyer' })).body;
  assert.deepEqual(r.suppliers.map((s) => [s.name, s.last, s.lowest]), [['Alpha Traders', 10, false]], 'one supplier: nothing to mark as lowest');
  assert.deepEqual(r.history.map((h) => h.unitCost).sort((x, y) => x - y), [7, 10], 'the unpriced and the unapproved lines are left out');
});

test('prices: one supplier alone is never called the lowest; a retired supplier is not offered', () => {
  const rows = [
    { supplier_id: 'a', supplier_name: 'A', supplier_active: 1, unit_cost: 12, day: '2026-11-01' },
    { supplier_id: 'b', supplier_name: 'B', supplier_active: 0, unit_cost: 9, day: '2026-10-01' },
  ];
  const out = bySupplier(rows, Date.parse('2026-11-12'));
  assert.deepEqual(out.map((s) => [s.name, s.lowest]), [['B', false], ['A', false]], 'the cheaper one no longer supplies, so nothing is marked');
  assert.equal(out[1].low, 12);
  assert.equal(out[1].high, 12);
});

test('prices on an order: what this supplier last charged, and another supplier only when it is cheaper', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const rice = await makeItem(env, { name: 'Rice' });
  const a = await supplier(env, 'Alpha Traders');
  const b = await supplier(env, 'Beta Supplies');
  await delivered(env, a, oil, 12, 10);
  await delivered(env, b, oil, 11, 20);

  const forA = (await call(env, 'POST', '/api/prices/guide', { as: 'buyer', body: { supplierId: a, itemIds: [oil, rice] } })).body;
  assert.deepEqual(forA[oil].here, { price: 12, day: day(-10) });
  assert.equal(forA[oil].best.supplierName, 'Beta Supplies');
  assert.equal(forA[oil].best.price, 11);
  assert.deepEqual(forA[rice], { here: null, best: null }, 'never bought: nothing to say');

  const forB = (await call(env, 'POST', '/api/prices/guide', { as: 'buyer', body: { supplierId: b, itemIds: [oil] } })).body;
  assert.equal(forB[oil].here.price, 11);
  assert.equal(forB[oil].best, null, 'the other supplier is dearer, so it is not mentioned');

  // The approver sees the last price on the order itself.
  const po = await order(env, a, [{ itemId: oil, qty: 4, unitCost: 13 }]);
  const seen = (await call(env, 'GET', `/api/pos/${po.id}`, { as: 'manager' })).body;
  assert.equal(seen.lines[0].last_cost, 12);
  assert.equal(seen.lines[0].best.price, 11);
});

test('prices: not for a role that does not see cost, and never another unit’s', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await supplier(env, 'Alpha Traders');
  await delivered(env, a, oil, 12, 3);
  assert.equal((await call(env, 'GET', `/api/items/${oil}/prices`, { as: 'staff' })).status, 403);
  assert.equal((await call(env, 'POST', '/api/prices/guide', { as: 'staff', body: { supplierId: a, itemIds: [oil] } })).status, 403);
  assert.equal((await call(env, 'GET', `/api/items/${oil}/prices`, { as: 'keeper' })).status, 200, 'the receiver types costs, so sees them');
  assert.equal((await call(env, 'GET', `/api/items/${oil}/prices`, { as: 'hv', unit: HV })).status, 404);
  assert.equal((await call(env, 'GET', `/api/suppliers/${a}`, { as: 'hv', unit: HV })).status, 404);
});

// ── Delivery record ──────────────────────────────────────────────────────────

test('delivery record: each order is judged on time, late, overdue, waiting, closed short or not datable', () => {
  const today = '2026-11-12';
  const o = (status, expected, last, short = 0) => ({ status, expected_date: expected, last_day: last, first_day: last, lines_short: short, decided_at: '2026-11-01T06:00:00.000Z' });
  const out = judgeOrders([
    o('RECEIVED', '2026-11-10', '2026-11-10'),        // arrived on the day
    o('RECEIVED', '2026-11-10', '2026-11-08'),        // early is on time
    o('RECEIVED', '2026-11-05', '2026-11-09'),        // four days late
    o('PARTLY_RECEIVED', '2026-11-10', '2026-11-09'), // some came, the rest is overdue
    o('APPROVED', '2026-11-20', null),                // not due yet
    o('RECEIVED', '2026-11-10', '2026-11-09', 2),     // closed with two lines never delivered
    o('RECEIVED', null, '2026-11-09'),                // no expected date
    o('APPROVED', null, null),                        // no date and nothing yet
  ], today);
  assert.deepEqual(out.each.map((x) => x.verdict), ['ON_TIME', 'ON_TIME', 'LATE', 'OVERDUE', 'WAITING', 'CLOSED_SHORT', 'NO_DATE', 'WAITING']);
  assert.deepEqual([out.onTime, out.late, out.overdue, out.waiting, out.closedShort, out.noDate, out.judged], [2, 1, 1, 2, 1, 1, 4]);
  assert.equal(out.each[2].daysLate, 4);
  assert.equal(out.each[3].daysLate, 2, 'overdue is counted from the expected date to today');
  assert.equal(out.usualDaysLate, 3);
  assert.equal(out.each[0].waitDays, 9, 'from approval to the first delivery');
});

test('delivery record: a supplier’s page, from its orders and deliveries, with lines short of the note', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const rice = await makeItem(env, { name: 'Rice' });
  const a = await supplier(env, 'Alpha Traders', { email: 'orders@alpha.example', leadDays: 3 });

  const onTime = await order(env, a, [{ itemId: oil, qty: 5, unitCost: 10 }], day(2));
  await deliver(env, { storeId: S.main, poId: onTime.id, lines: [{ itemId: oil, qty: 5, unitCost: 10 }] });
  const late = await order(env, a, [{ itemId: oil, qty: 5, unitCost: 10 }], day(-3));
  await deliver(env, { storeId: S.main, poId: late.id, lines: [{ itemId: oil, qty: 5, unitCost: 10, noteQty: 6 }] });
  const short = await order(env, a, [{ itemId: oil, qty: 5, unitCost: 10 }, { itemId: rice, qty: 2, unitCost: 4 }], day(2));
  await deliver(env, { storeId: S.main, poId: short.id, lines: [{ itemId: oil, qty: 5, unitCost: 10 }] });
  const closed = await call(env, 'POST', `/api/pos/${short.id}/close`, { as: 'keeper', body: { note: 'The supplier has stopped stocking rice.' } });
  assert.equal(closed.status, 200, JSON.stringify(closed.body));
  await order(env, a, [{ itemId: oil, qty: 1, unitCost: 10 }], day(9)); // approved, nothing yet, not due

  const page = (await call(env, 'GET', `/api/suppliers/${a}`, { as: 'manager' })).body;
  assert.equal(page.supplier.name, 'Alpha Traders');
  assert.deepEqual([page.record.orders, page.record.onTime, page.record.late, page.record.closedShort, page.record.waiting, page.record.judged], [4, 1, 1, 1, 1, 2]);
  assert.deepEqual(page.againstNote, { deliveries: 3, lines: 3, short: 1 }, 'one line counted less than its note said');
  assert.deepEqual(page.prices.map((p) => [p.name, p.last]), [['Massage oil', 10]]);
  assert.equal(page.orders.find((o) => o.ref === late.ref).daysLate, 3);

  const list = (await call(env, 'GET', '/api/suppliers/record', { as: 'manager' })).body;
  assert.deepEqual([list[a].judged, list[a].onTime, list[a].closedShort], [2, 1, 1]);

  // A role that sees orders but not cost gets the record without the prices; staff see neither.
  const forViewer = (await call(env, 'GET', `/api/suppliers/${a}`, { as: 'viewer' })).body;
  assert.equal(forViewer.record.onTime, 1);
  assert.equal((await call(env, 'GET', `/api/suppliers/${a}`, { as: 'staff' })).status, 403);
});

// ── The order as a PDF ───────────────────────────────────────────────────────

test('pdf: an order downloads as a PDF named for it, and a long one runs onto more pages', async () => {
  const env = testEnv();
  const a = await supplier(env, 'Alpha Traders', { contact: 'Ravi' });
  const ids = [];
  for (let i = 0; i < 70; i += 1) ids.push(await makeItem(env, { name: `Item number ${i} with a name long enough to need a second line on the page when it is printed` }));
  const po = await order(env, a, ids.map((itemId) => ({ itemId, qty: 2, unitCost: 3.5 })), day(4));

  const got = await download(env, `/api/pos/${po.id}/pdf`, { as: 'buyer' });
  assert.equal(got.status, 200);
  assert.equal(got.headers.get('content-type'), 'application/pdf');
  assert.match(got.headers.get('content-disposition'), new RegExp(`${po.ref}\\.pdf`));
  assert.equal(new TextDecoder().decode(got.bytes.slice(0, 5)), '%PDF-');
  const doc = await PDFDocument.load(got.bytes);
  assert.equal(doc.getTitle(), `Purchase order ${po.ref}`);
  assert.ok(doc.getPageCount() > 1, `70 two-line items need more than one page, got ${doc.getPageCount()}`);

  assert.equal((await download(env, `/api/pos/${po.id}/pdf`, { as: 'staff' })).status, 403);
  assert.equal((await download(env, `/api/pos/${po.id}/pdf`, { as: 'hv', unit: HV })).status, 404);
});

test('pdf: a name in a script the built-in fonts cannot draw does not stop the order', async () => {
  const env = testEnv();
  const a = await supplier(env, 'مؤسسة النور', { contact: 'Ravi “the buyer” — Kochi' });
  const item = await makeItem(env, { name: 'ധന്വന്തരം തൈലം 200ml' });
  const po = await order(env, a, [{ itemId: item, qty: 1, unitCost: 30 }]);
  const got = await download(env, `/api/pos/${po.id}/pdf`, { as: 'buyer' });
  assert.equal(got.status, 200);
  assert.equal(plain('Ravi “the buyer” — Kochi'), 'Ravi "the buyer" - Kochi');
  assert.equal(plain('ധന 200ml'), '?? 200ml');
});

// ── Emailing an approved order ───────────────────────────────────────────────

const MAIL = { MS_TENANT_ID: 'tenant-1', MS_CLIENT_ID: 'app-1', MS_CLIENT_SECRET: 'not-a-real-secret', MAIL_SENDER: 'purchasing@unit.example' };
/** A stand-in for Microsoft 365: hands out a token, then answers sendMail with `sendStatus`. */
function microsoft(sendStatus = 202, code = '') {
  const calls = [];
  const fetchLike = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('/oauth2/v2.0/token')) return new Response(JSON.stringify({ access_token: 'token-for-test' }), { status: 200 });
    return sendStatus === 202 ? new Response(null, { status: 202 }) : new Response(JSON.stringify({ error: { code } }), { status: sendStatus });
  };
  return { calls, fetchLike };
}

test('email: an approved order goes to the supplier with its PDF, and the send is kept on the order', async () => {
  const ms = microsoft();
  const env = testEnv({ ...MAIL, MAIL_FETCH: ms.fetchLike });
  const oil = await makeItem(env);
  const a = await supplier(env, 'Alpha Traders', { email: 'orders@alpha.example', contact: 'Ravi' });
  const po = await order(env, a, [{ itemId: oil, qty: 4, unitCost: 12 }], day(5));
  assert.equal((await call(env, 'GET', '/api/me', { as: 'buyer' })).body.has.mail, true);

  const sent = await call(env, 'POST', `/api/pos/${po.id}/email`, { as: 'buyer', body: { cc: 'store@unit.example', message: 'Please deliver before noon.' } });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  assert.deepEqual(sent.body, { ok: true, to: 'orders@alpha.example', cc: ['store@unit.example'] });

  assert.equal(ms.calls.length, 2);
  assert.match(ms.calls[0].url, /login\.microsoftonline\.com\/tenant-1\/oauth2/);
  assert.match(ms.calls[1].url, /graph\.microsoft\.com\/v1\.0\/users\/purchasing%40unit\.example\/sendMail$/);
  assert.equal(ms.calls[1].init.headers.authorization, 'Bearer token-for-test');
  const mail = JSON.parse(ms.calls[1].init.body);
  assert.equal(mail.message.subject, `Purchase order ${po.ref} from Herbal Park`);
  assert.deepEqual(mail.message.toRecipients, [{ emailAddress: { address: 'orders@alpha.example' } }]);
  assert.deepEqual(mail.message.ccRecipients, [{ emailAddress: { address: 'store@unit.example' } }]);
  assert.match(mail.message.body.content, /Dear Ravi/);
  assert.match(mail.message.body.content, /Please deliver before noon\./);
  assert.equal(mail.message.attachments[0].name, `${po.ref}.pdf`);
  assert.equal(atob(mail.message.attachments[0].contentBytes).slice(0, 5), '%PDF-');

  const row = env.DB.db.prepare(`SELECT to_email, cc, status, by_name, pdf_sha256 FROM po_emails WHERE po_id = ?`).get(po.id);
  assert.deepEqual([row.to_email, row.cc, row.status], ['orders@alpha.example', 'store@unit.example', 'SENT']);
  assert.match(row.pdf_sha256, /^[0-9a-f]{64}$/);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM audit_log WHERE action = 'PO_EMAIL' AND subject = ?`).get(po.ref).n, 1);
  assert.equal((await call(env, 'GET', `/api/pos/${po.id}`, { as: 'buyer' })).body.emails[0].status, 'SENT');
});

test('email: a second send must be asked for on purpose, so a double press sends one email', async () => {
  const ms = microsoft();
  const env = testEnv({ ...MAIL, MAIL_FETCH: ms.fetchLike });
  const a = await supplier(env, 'Alpha Traders', { email: 'orders@alpha.example' });
  const po = await order(env, a, [{ itemId: await makeItem(env), qty: 1, unitCost: 5 }]);
  assert.equal((await call(env, 'POST', `/api/pos/${po.id}/email`, { as: 'buyer', body: {} })).status, 200);
  const twice = await call(env, 'POST', `/api/pos/${po.id}/email`, { as: 'buyer', body: {} });
  assert.equal(twice.status, 409);
  assert.equal(twice.body.error.code, 'ALREADY_SENT');
  assert.match(twice.body.error.message, /already emailed to orders@alpha\.example/);
  assert.equal(ms.calls.length, 2, 'nothing more was sent');
  assert.equal((await call(env, 'POST', `/api/pos/${po.id}/email`, { as: 'manager', body: { again: true } })).status, 200);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM po_emails WHERE po_id = ? AND status = 'SENT'`).get(po.id).n, 2);
});

test('email: refused before anything is sent when it cannot be, each with a sentence to act on', async () => {
  const ms = microsoft();
  const env = testEnv({ ...MAIL, MAIL_FETCH: ms.fetchLike });
  const oil = await makeItem(env);
  const noEmail = await supplier(env, 'No Email Traders');
  const withEmail = await supplier(env, 'Alpha Traders', { email: 'orders@alpha.example' });

  const draft = await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId: withEmail, storeId: S.main, lines: [{ itemId: oil, qty: 1, unitCost: 5 }] } });
  const r1 = await call(env, 'POST', `/api/pos/${draft.body.id}/email`, { as: 'buyer', body: {} });
  assert.deepEqual([r1.status, r1.body.error.code], [409, 'NOT_APPROVED']);

  const po = await order(env, noEmail, [{ itemId: oil, qty: 1, unitCost: 5 }]);
  const r2 = await call(env, 'POST', `/api/pos/${po.id}/email`, { as: 'buyer', body: {} });
  assert.deepEqual([r2.status, r2.body.error.code], [422, 'NO_SUPPLIER_EMAIL']);

  const ok = await order(env, withEmail, [{ itemId: oil, qty: 1, unitCost: 5 }]);
  const r3 = await call(env, 'POST', `/api/pos/${ok.id}/email`, { as: 'buyer', body: { cc: 'not an address' } });
  assert.deepEqual([r3.status, r3.body.error.code], [422, 'BAD_EMAIL']);
  assert.match(r3.body.error.message, /“not an address”/, 'the whole of what was typed is quoted back');
  assert.equal((await call(env, 'POST', `/api/pos/${ok.id}/email`, { as: 'keeper', body: {} })).status, 403, 'a store keeper does not write to suppliers');
  assert.equal((await call(env, 'POST', `/api/pos/${ok.id}/email`, { as: 'hv', unit: HV, body: {} })).status, 404);
  assert.equal(ms.calls.length, 0, 'Microsoft 365 was never asked');
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM po_emails`).get().n, 0);
});

test('email: with no mailbox set up nothing is tried, and the app says so', async () => {
  const env = testEnv();
  const a = await supplier(env, 'Alpha Traders', { email: 'orders@alpha.example' });
  const po = await order(env, a, [{ itemId: await makeItem(env), qty: 1, unitCost: 5 }]);
  assert.equal((await call(env, 'GET', '/api/me', { as: 'buyer' })).body.has.mail, false);
  const r = await call(env, 'POST', `/api/pos/${po.id}/email`, { as: 'buyer', body: {} });
  assert.deepEqual([r.status, r.body.error.code], [409, 'MAIL_NOT_SET_UP']);
});

test('email: when Microsoft 365 refuses, the person is told what to do and the failure is kept', async () => {
  const ms = microsoft(403, 'ErrorAccessDenied');
  const env = testEnv({ ...MAIL, MAIL_FETCH: ms.fetchLike });
  const a = await supplier(env, 'Alpha Traders', { email: 'orders@alpha.example' });
  const po = await order(env, a, [{ itemId: await makeItem(env), qty: 1, unitCost: 5 }]);
  const r = await call(env, 'POST', `/api/pos/${po.id}/email`, { as: 'buyer', body: {} });
  assert.deepEqual([r.status, r.body.error.code], [502, 'MAIL_FAILED']);
  assert.match(r.body.error.message, /not allowed to send mail yet/);
  const row = env.DB.db.prepare(`SELECT status, error FROM po_emails WHERE po_id = ?`).get(po.id);
  assert.equal(row.status, 'FAILED');
  assert.match(row.error, /Mail\.Send/);
  // A failed send is not "already sent": trying again needs no special asking.
  env.MAIL_FETCH = microsoft().fetchLike;
  assert.equal((await call(env, 'POST', `/api/pos/${po.id}/email`, { as: 'buyer', body: {} })).status, 200);
});
