/**
 * The list of items on a document: use, transfer, receive, request, purchase order, correction.
 *
 * One component, a `mode` for what each line needs:
 *   out      quantity, checked against what the store holds (and batch choice for expiry items)
 *   in       quantity, cost, batch and expiry for items that track it
 *   request  quantity only
 *   po       quantity and agreed price
 *   adjust   a signed quantity: + adds, − takes away
 */

import { useEffect, useState } from 'react';
import Icon from './icons.jsx';
import { fmtMoney, fmtQty, get } from './api.js';
import { Field, ItemPicker, QtyInput, Select, Stepper } from './ui.jsx';

export const newLine = (item, extra = {}) => ({ key: `${item.id}-${Math.random().toString(36).slice(2, 7)}`, item, qty: '1', ...extra });

export function lineErrors(lines, mode, storeId) {
  const errs = {};
  const used = {};
  for (const l of lines) {
    const q = Number(l.qty);
    if (mode === 'adjust' ? !q : !(q > 0)) errs[l.key] = 'Enter a quantity';
    else if (mode === 'out') {
      used[l.item.id] = (used[l.item.id] || 0) + q;
      const s = l.item.stores?.find((x) => x.storeId === storeId);
      if (s && used[l.item.id] > s.qty) errs[l.key] = `Only ${fmtQty(s.qty)} ${l.item.uom} here`;
    } else if (mode === 'in' && l.item.tracksExpiry && !l.expiry) errs[l.key] = 'Enter the expiry date';
  }
  return errs;
}

export default function LineEditor({ mode, items, storeId, lines, setLines, currency = 'AED', showCost = false, pickerFilter, errors = {} }) {
  const add = (item) => {
    if (mode !== 'in' && lines.some((l) => l.item.id === item.id)) return;
    setLines([...lines, newLine(item, mode === 'in' || mode === 'po' ? { unitCost: item.lastCost ?? item.avgCost ?? '' } : {})]);
  };
  const set = (key, patch) => setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const drop = (key) => setLines(lines.filter((l) => l.key !== key));
  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0), 0);

  return (
    <div className="lines">
      <ItemPicker items={items} storeId={storeId} onPick={add} filter={pickerFilter}
        exclude={mode === 'in' ? [] : lines.map((l) => l.item.id)} />
      {lines.map((l) => {
        const here = l.item.stores?.find((s) => s.storeId === storeId);
        return (
          <div key={l.key} className={`line ${errors[l.key] ? 'danger' : ''}`}>
            <div className="min0">
              <div className="line-name">{l.item.name}</div>
              <div className="line-sub">
                <code>{l.item.code}</code>
                {here && mode !== 'in' && mode !== 'po' && <> · {fmtQty(here.qty)} {l.item.uom} in this store</>}
                {mode === 'adjust' && <> · enter − to take away, + to add</>}
              </div>
            </div>
            <button className="icon-btn" onClick={() => drop(l.key)} aria-label={`Remove ${l.item.name}`}><Icon name="trash" size={18} /></button>
            <div className="line-fields">
              <Field label={`Quantity (${l.item.uom})`} className="qty-field">
                {mode === 'adjust'
                  ? <QtyInput value={l.qty} min={undefined} onChange={(v) => set(l.key, { qty: v })} />
                  : <Stepper value={l.qty} onChange={(v) => set(l.key, { qty: v })} />}
              </Field>
              {(mode === 'in' || mode === 'po') && showCost && (
                <Field label={`Unit cost (${currency})`}>
                  <QtyInput value={l.unitCost} onChange={(v) => set(l.key, { unitCost: v })} label="Unit cost" />
                </Field>
              )}
              {mode === 'in' && l.item.tracksExpiry && (
                <>
                  <Field label="Expiry date"><input type="date" value={l.expiry || ''} onChange={(e) => set(l.key, { expiry: e.target.value })} /></Field>
                  <Field label="Batch / lot"><input value={l.batchNo || ''} onChange={(e) => set(l.key, { batchNo: e.target.value })} placeholder="Optional" /></Field>
                </>
              )}
              {mode === 'out' && l.item.tracksExpiry && storeId && <BatchChoice line={l} storeId={storeId} onChange={(batchId) => set(l.key, { batchId })} />}
            </div>
            {errors[l.key] && <div className="line-warning">{errors[l.key]}</div>}
          </div>
        );
      })}
      {(mode === 'in' || mode === 'po') && showCost && lines.length > 0 && (
        <p className="r"><span className="muted">Total </span><b>{fmtMoney(total, currency)}</b></p>
      )}
    </div>
  );
}

/** For an expiry-tracked item: first-expiry-first by default, or one named batch. */
function BatchChoice({ line, storeId, onChange }) {
  const [batches, setBatches] = useState([]);
  useEffect(() => {
    get(`/api/batches?store=${storeId}&item=${line.item.id}`).then(setBatches).catch(() => setBatches([]));
  }, [storeId, line.item.id]);
  if (!batches.length) return null;
  return (
    <Field label="Batch" hint="Left as first-expiry-first, the batch closest to its date is used first, and expired stock is never handed out.">
      <Select value={line.batchId || ''} onChange={(v) => onChange(v || null)} placeholder="First to expire (recommended)"
        options={batches.map((b) => ({ value: b.id, label: `${b.batch_no || 'No lot'} · ${b.expiry || 'no date'} · ${fmtQty(b.qty)}` }))} />
    </Field>
  );
}

export const toPayload = (lines, extra = () => ({})) => lines.map((l) => ({
  itemId: l.item.id, qty: Number(l.qty), ...(l.batchId ? { batchId: l.batchId } : {}),
  ...(l.unitCost !== undefined && l.unitCost !== '' ? { unitCost: Number(l.unitCost) } : {}),
  ...(l.expiry ? { expiry: l.expiry } : {}), ...(l.batchNo ? { batchNo: l.batchNo } : {}), ...extra(l),
}));
