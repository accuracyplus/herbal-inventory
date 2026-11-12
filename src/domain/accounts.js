/**
 * Landed cost, VAT and the accounts exports (feature 14, `landed.on`, `accounting.on`).
 *
 * LANDED COST. A delivery's charges (freight, customs, insurance, handling) are spread over its
 * lines in proportion to each line's value at the supplier's price, or by quantity when nothing
 * on it has a price. The stock is valued at the landed cost; the supplier's price stays on the
 * line for price history. Spread when the delivery is posted, so the approver sees the charges.
 *
 * VAT. Kept beside the net on each delivery line and in total. Recoverable for a VAT-registered
 * business, so never part of the stock's cost. Every line takes the unit's rate unless it says
 * otherwise (zero-rated, exempt).
 *
 * EXPORTS. What the accounts system needs, for any dates: purchases (with TRN, invoice, net,
 * VAT, gross), credit notes, use by month, department and category, and write-offs and count
 * differences. Rows, not a file, so the page writes the CSV the same way as every other export.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, isoDate, m2, nonNegative, q3, text, uuid } from '../lib/data.js';
import { featureOn, requireFeature, setting } from './settings.js';

export const CHARGE_KINDS = { FREIGHT: 'Freight', CUSTOMS: 'Customs duty', INSURANCE: 'Insurance', HANDLING: 'Handling and clearing', OTHER: 'Other' };

/** Charges from a request body, checked. Empty when there are none. */
export async function parseCharges(env, unitId, raw) {
  if (!Array.isArray(raw) || !raw.length) return [];
  await requireFeature(env, unitId, 'landed.on');
  if (raw.length > 10) refuse('TOO_MANY', 'At most 10 charges on one delivery.');
  return raw.map((c, i) => {
    const kind = String(c?.kind || '');
    if (!CHARGE_KINDS[kind]) refuse('CHARGE_KIND', `Charge ${i + 1}: freight, customs, insurance, handling or other.`);
    const amount = nonNegative(c.amount);
    if (amount === null || amount === 0) refuse('CHARGE_AMOUNT', `${CHARGE_KINDS[kind]}: enter the amount, above zero.`);
    return { id: uuid(), kind, amount: m2(amount), note: text(c.note, 200) };
  }).filter(Boolean);
}

/**
 * Each line's share of the charges, and its landed unit cost. Pure. By value; by quantity when
 * no line has a value. The shares add up to the charges exactly: the rounding is put on the
 * largest line.
 */
export function spreadCharges(lines, chargesTotal) {
  const total = m2(chargesTotal || 0);
  const values = lines.map((l) => l.qty * (l.unitCost || 0));
  const byValue = values.some((v) => v > 0);
  const weights = byValue ? values : lines.map((l) => l.qty);
  const sum = weights.reduce((s, w) => s + w, 0);
  const shares = weights.map((w) => (sum > 0 ? m2((total * w) / sum) : 0));
  const diff = m2(total - shares.reduce((s, x) => s + x, 0));
  if (diff && shares.length) {
    const at = weights.indexOf(Math.max(...weights));
    shares[at] = m2(shares[at] + diff);
  }
  return lines.map((l, i) => ({
    share: shares[i],
    landed: l.qty > 0 ? Math.round(((l.unitCost || 0) + shares[i] / l.qty) * 10000) / 10000 : l.unitCost || 0,
  }));
}

/** VAT on each line, at its own rate or the unit's. Sets l.vatRate and l.vat. Only with accounts on. */
export async function applyVat(env, unitId, lines, raws) {
  if (!(await featureOn(env, unitId, 'accounting.on'))) return 0;
  const rate = Number(await setting(env, unitId, 'accounting.vat_rate')) || 0;
  lines.forEach((l, i) => {
    const raw = raws[i]?.vatRate;
    const r = raw === undefined || raw === null || raw === '' ? rate : Number(raw);
    if (!(r >= 0 && r <= 100)) refuse('BAD_VAT', `Line ${i + 1}: a VAT rate from 0 to 100.`);
    l.vatRate = r;
    l.vat = m2((l.qty * (l.unitCost || 0) * r) / 100);
  });
  return m2(lines.reduce((s, l) => s + l.vat, 0));
}

// ── Exports ──────────────────────────────────────────────────────────────────────────────

const day = (v) => isoDate(v);
/** The UTC moments a Gulf date range covers. */
const span = (from, to) => [new Date(`${from}T00:00:00+04:00`).toISOString(), new Date(`${to}T23:59:59.999+04:00`).toISOString()];

export const EXPORTS = {
  purchases: 'Purchases: every delivery line, with the supplier, TRN, invoice, net, VAT and gross',
  credits: 'Credit notes from suppliers, for goods sent back',
  consumption: 'Use: value by month, department and category',
  writeoffs: 'Write-offs, failed inspections and count differences',
};

export async function accountsExport(env, user, { kind, from, to }) {
  await requireFeature(env, user.unitId, 'accounting.on');
  if (!EXPORTS[kind]) refuse('BAD_EXPORT', `Choose one of: ${Object.keys(EXPORTS).join(', ')}.`);
  const a = day(from);
  const b = day(to);
  if (!a || !b) refuse('BAD_DATE', 'Choose the first and last day.');
  if (a > b) refuse('BAD_DATE', 'The first day is after the last.');
  const [fromAt, toAt] = span(a, b);
  const u = user.unitId;
  const rows = async (sql, ...args) => (await env.DB.prepare(sql).bind(...args).all()).results || [];

  if (kind === 'purchases') {
    const list = await rows(
      `SELECT r.decided_at AS posted_at, r.ref, r.note_no, r.invoice_no, r.invoice_date, s.name AS supplier, s.trn,
              st.name AS store, i.code, i.name AS item, i.category, i.uom, rl.qty, rl.unit_cost, rl.landed_cost, rl.vat_rate, rl.vat,
              rl.pack_label, rl.pack_qty
         FROM receipt_lines rl JOIN receipts r ON r.id = rl.receipt_id JOIN items i ON i.id = rl.item_id JOIN stores st ON st.id = r.store_id
         LEFT JOIN suppliers s ON s.id = r.supplier_id
        WHERE r.unit_id = ? AND r.status = 'APPROVED' AND r.decided_at >= ? AND r.decided_at <= ?
        ORDER BY r.decided_at, r.ref, i.name`, u, fromAt, toAt);
    return list.map((x) => {
      const net = m2(x.qty * x.unit_cost);
      return {
        date: gstDate(Date.parse(x.posted_at)), delivery: x.ref, supplier: x.supplier || '', trn: x.trn || '', invoice: x.invoice_no || '',
        invoice_date: x.invoice_date || '', note: x.note_no || '', store: x.store, code: x.code, item: x.item, category: x.category,
        qty: q3(x.qty), uom: x.uom, unit_price: x.unit_cost, net, vat_rate: x.vat_rate ?? '', vat: m2(x.vat || 0), gross: m2(net + (x.vat || 0)),
        charges: x.landed_cost != null ? m2((x.landed_cost - x.unit_cost) * x.qty) : 0,
        stock_value: m2(x.qty * (x.landed_cost ?? x.unit_cost)),
        pack: x.pack_label ? `${x.pack_qty} x ${x.pack_label}` : '',
      };
    });
  }
  if (kind === 'credits') {
    const list = await rows(
      `SELECT sr.ref, sr.credit_no, sr.credit_date, sr.credit_amount, sr.value, sr.reason, s.name AS supplier, s.trn, r.ref AS delivery, r.invoice_no
         FROM supplier_returns sr JOIN receipts r ON r.id = sr.receipt_id LEFT JOIN suppliers s ON s.id = sr.supplier_id
        WHERE sr.unit_id = ? AND sr.status = 'CREDITED' AND sr.credit_date >= ? AND sr.credit_date <= ?
        ORDER BY sr.credit_date, sr.ref`, u, a, b);
    return list.map((x) => ({
      date: x.credit_date, credit_note: x.credit_no, return: x.ref, supplier: x.supplier || '', trn: x.trn || '',
      delivery: x.delivery, invoice: x.invoice_no || '', amount: m2(x.credit_amount), expected: m2(x.value),
    }));
  }
  if (kind === 'consumption') {
    const list = await rows(
      `SELECT strftime('%Y-%m', m.at, '+4 hours') AS month, COALESCE(d.name, 'No department') AS department, i.category,
              round(SUM(-m.value), 2) AS value, COUNT(*) AS lines
         FROM movements m JOIN items i ON i.id = m.item_id LEFT JOIN departments d ON d.id = m.department_id
        WHERE m.unit_id = ? AND m.kind = 'ISSUE' AND m.at >= ? AND m.at <= ?
        GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`, u, fromAt, toAt);
    return list;
  }
  const list = await rows(
    `SELECT m.at, m.kind, m.reason, m.doc_ref, st.name AS store, i.code, i.name AS item, i.category, i.uom, m.qty, m.value
       FROM movements m JOIN items i ON i.id = m.item_id JOIN stores st ON st.id = m.store_id
      WHERE m.unit_id = ? AND m.kind IN ('ADJUST','COUNT') AND m.at >= ? AND m.at <= ?
      ORDER BY m.at`, u, fromAt, toAt);
  return list.map((x) => ({
    date: gstDate(Date.parse(x.at)), document: x.doc_ref || '', what: x.kind === 'COUNT' ? 'Count difference' : x.reason === 'FAILED_INSPECTION' ? 'Failed inspection' : 'Correction',
    reason: x.reason || '', store: x.store, code: x.code, item: x.item, category: x.category, qty: q3(x.qty), uom: x.uom, value: m2(x.value),
  }));
}
