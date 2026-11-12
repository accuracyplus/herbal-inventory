import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noteDate, parseNote } from '../src/domain/notes.js';
import { bal, call, deliver, download, hfidToken, HV, jpegBytes, makeItem, pdfBytes, PEOPLE, S, testEnv, upload } from './helpers/http.js';

const record = (env, body, as = 'keeper') => call(env, 'POST', '/api/receipts', { as, body });
const act = (env, id, action, as = 'manager', body) => call(env, 'POST', `/api/receipts/${id}/${action}`, { as, body });
const attach = (env, id, opts = {}) => upload(env, `/api/receipts/${id}/files`, { kind: 'NOTE', ...opts });
const get = async (env, id, as = 'manager') => (await call(env, 'GET', `/api/receipts/${id}`, { as })).body;
const one = (itemId, qty = 10, extra = {}) => ({ storeId: S.main, lines: [{ itemId, qty, unitCost: 4, ...extra }] });
const setting = (env, key, value) => call(env, 'PUT', '/api/settings', { body: { [key]: value } });

async function supplier(env, name = 'Kerala Ayurveda Traders') {
  return (await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name } })).body.id;
}
async function order(env, sup, lines) {
  const po = await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId: sup, storeId: S.main, lines } });
  await call(env, 'POST', `/api/pos/${po.body.id}/submit`, { as: 'buyer' });
  await call(env, 'POST', `/api/pos/${po.body.id}/approve`, { as: 'manager' });
  return po.body;
}

// ── Two steps ────────────────────────────────────────────────────────────────

test('delivery: recorded by the receiver, on the shelf only when somebody else approves', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const rec = await record(env, { ...one(oil), noteNo: 'DN-771', noteDate: '2026-11-10' });
  assert.equal(rec.status, 201);
  assert.equal(rec.body.status, 'PENDING');
  assert.match(rec.body.ref, /^HP-GRN-0001$/);
  assert.equal(bal(env, S.main, oil).qty, 0);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM movements`).get().n, 0);
  assert.equal(env.DB.db.prepare(`SELECT avg_cost FROM items WHERE id = ?`).get(oil).avg_cost, 0);

  await attach(env, rec.body.id);
  const ok = await act(env, rec.body.id, 'approve');
  assert.equal(ok.status, 200);
  assert.equal(bal(env, S.main, oil).qty, 10);
  assert.equal(env.DB.db.prepare(`SELECT avg_cost FROM items WHERE id = ?`).get(oil).avg_cost, 4);
  const r = await get(env, rec.body.id);
  assert.deepEqual([r.status, r.by_name, r.decided_by_name, r.note_no, r.note_date], ['APPROVED', 'Kiran Keeper', 'Maya Manager', 'DN-771', '2026-11-10']);
  const m = env.DB.db.prepare(`SELECT kind, qty, doc_ref, actor_name FROM movements`).get();
  assert.deepEqual({ ...m }, { kind: 'RECEIPT', qty: 10, doc_ref: 'HP-GRN-0001', actor_name: 'Maya Manager' });
});

test('delivery: nobody approves their own, and only managers approve at all', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const mine = await record(env, one(oil), 'manager');
  await attach(env, mine.body.id, { as: 'manager' });
  const self = await act(env, mine.body.id, 'approve', 'manager');
  assert.equal(self.status, 403);
  assert.equal(self.body.error.code, 'FOUR_EYES');
  assert.equal((await act(env, mine.body.id, 'approve', 'keeper')).status, 403);
  assert.equal((await act(env, mine.body.id, 'approve', 'buyer')).status, 403);
  assert.equal(bal(env, S.main, oil).qty, 0);
  assert.equal((await act(env, mine.body.id, 'approve', 'admin')).status, 200);
});

test('delivery: it cannot be approved without its delivery note; an invoice will do; a unit can relax it', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  const bare = await act(env, a.body.id, 'approve');
  assert.equal(bare.status, 422);
  assert.equal(bare.body.error.code, 'NOTE_REQUIRED');
  await attach(env, a.body.id, { kind: 'LPO' });
  assert.equal((await act(env, a.body.id, 'approve')).body.error.code, 'NOTE_REQUIRED', 'the LPO is not the note');
  await attach(env, a.body.id, { kind: 'INVOICE' });
  assert.equal((await act(env, a.body.id, 'approve')).status, 200);

  const b = await record(env, one(oil));
  await setting(env, 'receipts.note', 'optional');
  assert.equal((await act(env, b.body.id, 'approve')).status, 200);
});

test('delivery: a note that was attached and then removed no longer counts', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  const f = await attach(env, a.body.id);
  assert.equal((await call(env, 'POST', `/api/files/${f.body.id}/remove`, { as: 'keeper' })).status, 200);
  assert.equal((await act(env, a.body.id, 'approve')).body.error.code, 'NOTE_REQUIRED');
  assert.deepEqual((await get(env, a.body.id)).files, []);
});

test('delivery: sent back with a reason, cancelled by the receiver, and neither reaches the shelf', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  assert.equal((await act(env, a.body.id, 'reject')).body.error.code, 'REASON_REQUIRED');
  assert.equal((await act(env, a.body.id, 'reject', 'manager', { note: 'Two boxes were damaged, count again' })).status, 200);
  assert.equal((await get(env, a.body.id, 'keeper')).decision_note, 'Two boxes were damaged, count again');
  assert.equal((await act(env, a.body.id, 'approve')).status, 409);

  const b = await record(env, one(oil));
  assert.equal((await act(env, b.body.id, 'cancel', 'buyer')).status, 403, 'somebody else\'s delivery');
  assert.equal((await act(env, b.body.id, 'cancel', 'keeper')).status, 200);
  assert.equal(bal(env, S.main, oil).qty, 0);
  assert.equal((await attach(env, b.body.id)).status, 409, 'nothing more is attached to a cancelled delivery');
});

test('delivery: approved twice, the stock arrives once', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  await attach(env, a.body.id);
  await act(env, a.body.id, 'approve');
  assert.equal((await act(env, a.body.id, 'approve', 'admin')).status, 409);
  // Even past the status check, the posting itself can only happen once.
  env.DB.db.prepare(`UPDATE receipts SET status = 'PENDING' WHERE id = ?`).run(a.body.id);
  const again = await act(env, a.body.id, 'approve', 'admin');
  assert.equal(again.status, 409);
  assert.equal(again.body.error.code, 'DUPLICATE');
  assert.equal(bal(env, S.main, oil).qty, 10);
});

test('delivery: a unit can switch the approval step off, and then it is on the shelf when recorded', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await setting(env, 'receipts.approval', 'none');
  const a = await record(env, one(oil));
  assert.equal(a.body.status, 'APPROVED');
  assert.equal(bal(env, S.main, oil).qty, 10);
  assert.equal((await act(env, a.body.id, 'approve')).status, 409);
  assert.equal((await attach(env, a.body.id, { kind: 'INVOICE' })).status, 201, 'the invoice can still follow');
});

test('delivery: an item with expiry dates needs its date when recorded, so approval never trips on it', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { tracksExpiry: true });
  assert.equal((await record(env, one(oil))).body.error.code, 'EXPIRY_REQUIRED');
  assert.equal((await record(env, one(oil, 5, { expiry: '2026-13-45' }))).body.error.code, 'BAD_DATE');
  await deliver(env, one(oil, 5, { expiry: '2099-06-30', batchNo: 'L7' }));
  assert.deepEqual({ ...env.DB.db.prepare(`SELECT batch_no, expiry, qty FROM batches`).get() }, { batch_no: 'L7', expiry: '2099-06-30', qty: 5 });
});

test('delivery: the order is counted as received at approval, and two waiting deliveries cannot both overfill it', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const po = await order(env, await supplier(env), [{ itemId: oil, qty: 10, unitCost: 30 }]);
  const a = await record(env, { storeId: S.main, poId: po.id, lines: [{ itemId: oil, qty: 8 }] });
  const b = await record(env, { storeId: S.main, poId: po.id, lines: [{ itemId: oil, qty: 8 }] });
  assert.equal(b.status, 201, 'each is fine alone');
  let p = (await call(env, 'GET', `/api/pos/${po.id}`, { as: 'manager' })).body;
  assert.deepEqual([p.status, p.lines[0].received_qty, p.receipts.length], ['APPROVED', 0, 2]);
  await attach(env, a.body.id); await attach(env, b.body.id);
  assert.equal((await act(env, a.body.id, 'approve')).status, 200);
  const second = await act(env, b.body.id, 'approve');
  assert.equal(second.status, 422);
  assert.equal(second.body.error.code, 'OVER_RECEIVED');
  p = (await call(env, 'GET', `/api/pos/${po.id}`, { as: 'manager' })).body;
  assert.deepEqual([p.status, p.lines[0].received_qty], ['PARTLY_RECEIVED', 8]);
  assert.equal(bal(env, S.main, oil).qty, 8);
});

test('delivery: another unit sees none of it', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  const f = await attach(env, a.body.id);
  assert.equal((await call(env, 'GET', `/api/receipts/${a.body.id}`, { as: 'hv' })).status, 404);
  assert.equal((await act(env, a.body.id, 'approve', 'hv')).status, 404);
  assert.equal((await download(env, `/api/files/${f.body.id}`, { as: 'hv' })).status, 404);
  assert.equal((await attach(env, a.body.id, { as: 'hv' })).status, 404);
  assert.deepEqual((await call(env, 'GET', '/api/receipts', { as: 'hv' })).body, []);
  assert.equal((await call(env, 'GET', '/api/receipts', { as: 'admin', unit: HV })).body.length, 0);
});

// ── Differences ──────────────────────────────────────────────────────────────

test('differences: counted against the note, the note against the order, and the price against the order', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { name: 'Pinda thailam' });
  const herb = await makeItem(env, { name: 'Kizhi powder' });
  const soap = await makeItem(env, { name: 'Soap' });
  const po = await order(env, await supplier(env), [{ itemId: oil, qty: 24, unitCost: 30 }, { itemId: herb, qty: 5, unitCost: 8 }, { itemId: soap, qty: 3, unitCost: 2 }]);
  const a = await record(env, { storeId: S.main, poId: po.id, lines: [
    { itemId: oil, qty: 22, noteQty: 24, unitCost: 32 },
    { itemId: herb, qty: 3, noteQty: 3 },
  ] });
  const r = await get(env, a.body.id);
  assert.deepEqual(r.flags.map((f) => [f.kind, f.tone]), [['ORDER_QTY', 'info'], ['COUNT', 'warn'], ['PRICE', 'warn'], ['MISSING', 'info']]);
  const text = r.flags.map((f) => f.text).join(' | ');
  assert.match(text, /Pinda thailam: counted 22 bottle, the note says 24 \(2 short\)/);
  assert.match(text, /Pinda thailam: priced at 32\.00 on this delivery, 30\.00 on HP-PO-0001/);
  assert.match(text, /Kizhi powder: 3 bottle delivered of 5 still to come on HP-PO-0001; 2 outstanding/);
  assert.match(text, /On HP-PO-0001 but not on this delivery: Soap/);
  assert.equal((await call(env, 'GET', '/api/receipts', { as: 'manager' })).body[0].differences, 1);
  assert.equal(r.lines.find((l) => l.name === 'Kizhi powder').unit_cost, 8, 'the order\'s price when none was typed');
});

test('differences: a delivery that matches its note and its order has none', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const po = await order(env, await supplier(env), [{ itemId: oil, qty: 6, unitCost: 30 }]);
  const a = await record(env, { storeId: S.main, poId: po.id, lines: [{ itemId: oil, qty: 6, noteQty: 6, unitCost: 30 }] });
  assert.deepEqual((await get(env, a.body.id)).flags, []);
});

// ── Files ────────────────────────────────────────────────────────────────────

test('files: kept with who attached them, when, and the fingerprint of their bytes; read back unchanged', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  const bytes = jpegBytes('the delivery note');
  const f = await attach(env, a.body.id, { bytes, name: 'IMG_2041.jpg', type: 'image/jpeg' });
  assert.equal(f.status, 201);
  assert.deepEqual([f.body.kind, f.body.name, f.body.mime, f.body.bytes, f.body.uploaded_by_name], ['NOTE', 'IMG_2041.jpg', 'image/jpeg', bytes.length, 'Kiran Keeper']);
  assert.match(f.body.sha256, /^[0-9a-f]{64}$/);
  const back = await download(env, `/api/files/${f.body.id}`, { as: 'manager' });
  assert.equal(back.status, 200);
  assert.equal(back.headers.get('content-type'), 'image/jpeg');
  assert.deepEqual([...back.bytes], [...bytes]);
  assert.equal((await get(env, a.body.id)).hasNote, true);
  const log = (await call(env, 'GET', '/api/audit', { as: 'admin' })).body.find((x) => x.action === 'FILE_ATTACH');
  assert.match(log.detail, /Delivery note: IMG_2041\.jpg, .* sha256 [0-9a-f]{16}/);
});

test('files: judged by what they are, not what they are called; too big, twice, or with no kind is refused', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  const fake = await attach(env, a.body.id, { bytes: new TextEncoder().encode('<script>alert(1)</script>'), name: 'note.jpg', type: 'image/jpeg' });
  assert.equal(fake.status, 422);
  assert.equal(fake.body.error.code, 'FILE_TYPE');
  const big = new Uint8Array(8 * 1024 * 1024 + 10); big.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
  assert.equal((await attach(env, a.body.id, { bytes: big })).body.error.code, 'FILE_TOO_BIG');
  const same = pdfBytes();
  assert.equal((await attach(env, a.body.id, { bytes: same })).status, 201);
  assert.equal((await attach(env, a.body.id, { bytes: same })).status, 409);
  assert.equal((await attach(env, a.body.id, { kind: 'SELFIE' })).body.error.code, 'BAD_KIND');
  assert.equal((await attach(env, a.body.id, { bytes: null })).body.error.code, 'NO_FILE');
  assert.equal(env.FILES.objects.size, 1);
});

test('files: who may attach, see and remove', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  assert.equal((await attach(env, a.body.id, { as: 'staff' })).status, 403);
  assert.equal((await attach(env, a.body.id, { as: 'viewer' })).status, 403);
  const f = await attach(env, a.body.id);
  assert.equal((await download(env, `/api/files/${f.body.id}`, { as: 'viewer' })).status, 200, 'a viewer reads');
  assert.equal((await download(env, `/api/files/${f.body.id}`, { as: 'staff' })).status, 403);
  assert.equal((await call(env, 'POST', `/api/files/${f.body.id}/remove`, { as: 'buyer' })).status, 403, 'not theirs');
  await act(env, a.body.id, 'approve');
  const late = await call(env, 'POST', `/api/files/${f.body.id}/remove`, { as: 'keeper' });
  assert.equal(late.status, 409, 'the paper an approval rested on stays');
});

test('files: one changed in storage is refused, not shown as the delivery note', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  const f = await attach(env, a.body.id);
  const [key] = [...env.FILES.objects.keys()];
  assert.match(key, new RegExp(`^u-hp/receipt/${a.body.id}/[0-9a-f]{64}\\.pdf$`));
  env.FILES.objects.get(key).bytes = pdfBytes('a different note');
  const back = await download(env, `/api/files/${f.body.id}`, { as: 'manager' });
  assert.equal(back.status, 409);
  env.FILES.objects.delete(key);
  assert.equal((await download(env, `/api/files/${f.body.id}`, { as: 'manager' })).status, 404);
});

test('files: with no storage set up the app says so, and /version shows what is bound', async () => {
  const env = testEnv({ FILES: undefined, noAi: true });
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  const f = await attach(env, a.body.id);
  assert.equal(f.status, 503);
  assert.equal(f.body.error.code, 'FILES_OFF');
  const v = await call(env, 'GET', '/version', { as: null });
  assert.deepEqual(v.body.bindings, { files: false, ai: false, hfid: true, mail: false });
  assert.deepEqual((await call(env, 'GET', '/api/me', { as: 'keeper' })).body.has, { files: false, reading: false, mail: false });
});

// ── Reading the note ─────────────────────────────────────────────────────────

const NOTE = {
  supplier: 'KERALA AYURVEDA TRADERS L.L.C', note_no: 'DN-4471', date: '10/11/2026',
  lines: [
    { text: 'Dhanwantharam Thailam 200ml (Box of 12)', qty: 2, unit: 'box', unit_price: 360 },
    { text: 'Kizhi Powder 1kg', qty: '5', unit: 'kg', unit_price: 'AED 18.50' },
    { text: 'Item KZ-77 herbal mix', qty: 1, unit: null, unit_price: null },
    { text: 'Something we do not stock', qty: 3, unit: 'pcs', unit_price: 1 },
    { text: '', qty: 1 },
  ],
};
const read = (env, opts = {}) => upload(env, '/api/receipts/read', { bytes: jpegBytes('note photo'), name: 'note.jpg', type: 'image/jpeg', ...opts });

test('reading: what the model read comes back as suggestions matched to this unit', async () => {
  const calls = [];
  const env = testEnv({ aiReply: NOTE, aiCalls: calls });
  await supplier(env);
  const kizhi = await makeItem(env, { name: 'Kizhi powder' });
  const mix = await makeItem(env, { name: 'Herbal mix special', code: 'KZ-77' });
  await makeItem(env, { name: 'Dhanwantharam thailam' });
  await makeItem(env, { name: 'Dhanwantharam 200ml' });
  const r = await read(env);
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.supplier.name, r.body.noteNo, r.body.date], ['Kerala Ayurveda Traders', 'DN-4471', '2026-11-10']);
  assert.equal(r.body.lines.length, 4, 'the empty line is dropped');
  const [thailam, powder, coded, unknown] = r.body.lines;
  assert.deepEqual([thailam.qty, thailam.unitPrice, thailam.match], [2, 360, null], 'two items fit the wording, so no guess is made');
  assert.deepEqual([powder.qty, powder.unitPrice, powder.match], [5, 18.5, { itemId: kizhi, factor: 1, source: 'guess' }]);
  assert.deepEqual(coded.match, { itemId: mix, factor: 1, source: 'code' });
  assert.equal(unknown.match, null);
  // It asked the first model on the list, with the picture, and nothing was saved by reading.
  assert.equal(calls[0].model, '@cf/meta/llama-4-scout-17b-16e-instruct');
  assert.match(calls[0].input.messages[0].content[1].image_url.url, /^data:image\/jpeg;base64,/);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM receipts`).get().n, 0);
  assert.equal(env.FILES.objects.size, 0);
});

test('reading: what the receiver confirms is remembered for that supplier, and a correction replaces it', async () => {
  const env = testEnv({ aiReply: NOTE });
  const sup = await supplier(env);
  const small = await makeItem(env, { name: 'Dhanwantharam thailam' });
  const large = await makeItem(env, { name: 'Dhanwantharam thailam large' });
  const line = (itemId, factor) => ({ itemId, qty: 2 * factor, noteQty: 2 * factor, unitCost: 360 / factor, noteText: 'Dhanwantharam Thailam 200ml (Box of 12)', factor });
  await record(env, { storeId: S.main, supplierId: sup, lines: [line(small, 12)] });
  let r = await read(env);
  assert.deepEqual(r.body.lines[0].match, { itemId: small, factor: 12, source: 'remembered' });
  // Same wording, differently spaced and cased, is the same line.
  env.aiReply = { ...NOTE, lines: [{ text: 'DHANWANTHARAM  THAILAM 200ML (BOX OF 12)', qty: 1 }] };
  r = await read(env);
  assert.equal(r.body.lines.length, 1, 'the changed reply was used');
  assert.equal(r.body.lines[0].match.source, 'remembered');

  await record(env, { storeId: S.main, supplierId: sup, lines: [line(large, 6)] });
  env.aiReply = NOTE;
  r = await read(env);
  assert.deepEqual(r.body.lines[0].match, { itemId: large, factor: 6, source: 'remembered' });
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM supplier_item_map`).get().n, 1);
});

test('reading: one supplier\'s wording is not another\'s, and a delivery with no supplier remembers nothing', async () => {
  const env = testEnv({ aiReply: { ...NOTE, supplier: 'Gulf Herbs' } });
  const kerala = await supplier(env);
  await supplier(env, 'Gulf Herbs');
  const a = await makeItem(env, { name: 'Oil A' });
  const text = 'Dhanwantharam Thailam 200ml (Box of 12)';
  await record(env, { storeId: S.main, supplierId: kerala, lines: [{ itemId: a, qty: 12, noteText: text, factor: 12 }] });
  await record(env, { storeId: S.main, lines: [{ itemId: a, qty: 1, noteText: 'Loose line', factor: 1 }] });
  assert.equal((await read(env)).body.lines[0].match, null);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM supplier_item_map`).get().n, 1);
  // Told which supplier it is, the page gets that supplier's memory whatever the model read.
  assert.equal((await read(env, { supplierId: kerala })).body.lines[0].match.source, 'remembered');
});

test('reading: a retired model is passed over, prose around the JSON is tolerated, and nonsense is said to be unreadable', async () => {
  const calls = [];
  const env = testEnv({ aiCalls: calls, aiReply: (model) => (model.includes('scout') ? new Error('5028: model deprecated') : `Here is the note:\n\`\`\`json\n${JSON.stringify(NOTE)}\n\`\`\``) });
  const ok = await read(env);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.model, '@cf/mistralai/mistral-small-3.1-24b-instruct');
  assert.equal(ok.body.lines.length, 4);
  env.aiReply = 'I am sorry, I cannot read this image.';
  const bad = await read(env);
  assert.equal(bad.status, 422);
  assert.equal(bad.body.error.code, 'NOTE_UNREADABLE');
  env.aiReply = new Error('quota exceeded');
  assert.equal((await read(env)).body.error.code, 'NOTE_UNREADABLE');
});

test('reading: off when the unit switches it off or the app has no model, photos only, and receivers only', async () => {
  const env = testEnv({ aiReply: NOTE });
  assert.equal((await read(env, { as: 'staff' })).status, 403);
  assert.equal((await read(env, { bytes: pdfBytes() })).body.error.code, 'FILE_TYPE');
  await setting(env, 'receipts.read_notes', 'off');
  assert.equal((await read(env)).body.error.code, 'READING_OFF');
  const none = testEnv({ noAi: true });
  const r = await read(none);
  assert.equal(r.status, 503);
  assert.equal(r.body.error.code, 'READING_OFF');
});

test('reading: dates day first, and what a model returns is cleaned before anything trusts it', () => {
  assert.equal(noteDate('10/11/2026'), '2026-11-10');
  assert.equal(noteDate('3-1-26'), '2026-01-03');
  assert.equal(noteDate('2026-11-10'), '2026-11-10');
  assert.equal(noteDate('31/02/2026'), null);
  assert.equal(noteDate('November 10'), null);
  assert.equal(parseNote('no json here'), null);
  assert.equal(parseNote('{"lines": "none"}'), null);
  assert.equal(parseNote({ lines: [] }), null);
  const n = parseNote({ supplier: ' X ', lines: [{ text: 'A', qty: -2, unit_price: '1,250.50' }, { text: 'B', qty: 'three' }, { qty: 1 }] });
  assert.deepEqual(n.lines, [{ text: 'A', qty: null, unit: null, unitPrice: 1250.5 }, { text: 'B', qty: null, unit: null, unitPrice: null }]);
});

// ── Around it ────────────────────────────────────────────────────────────────

test('today and the hub: approvers are told what waits, a receiver is told what came back, reports count only what was approved', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const a = await record(env, one(oil));
  const waiting = async (as) => (await call(env, 'GET', '/api/today', { as })).body.waiting;
  assert.equal((await waiting('manager')).find((w) => w.key === 'receipts-approve').n, 1);
  assert.ok(!(await waiting('keeper')).some((w) => w.key === 'receipts-approve'));
  const hub = await call(env, 'POST', '/pending/service', { token: hfidToken({ svc: 'pending', emp_code: PEOPLE.manager.code }) });
  assert.ok(hub.body.items.some((i) => i.text === '1 delivery to approve' && i.detail === 'Herbal Park'));
  const report = async () => (await call(env, 'GET', '/api/reports/purchases', { as: 'manager' })).body.receipts.length;
  assert.equal(await report(), 0);
  await act(env, a.body.id, 'reject', 'manager', { note: 'Wrong store' });
  assert.equal((await waiting('keeper')).find((w) => w.key === 'receipts-back').n, 1);
  assert.equal(await report(), 0);
  await deliver(env, one(oil));
  assert.equal(await report(), 1);
  const list = await call(env, 'GET', '/api/receipts?status=REJECTED', { as: 'keeper' });
  assert.deepEqual(list.body.map((r) => [r.ref, r.decision_note]), [['HP-GRN-0001', 'Wrong store']]);
  assert.equal((await call(env, 'GET', '/api/receipts', { as: 'staff' })).status, 403);
});
