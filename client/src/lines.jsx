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
import { QuantityField } from '@hifive/ui';
import { Button, Field, ItemPicker, Pill, QtyInput, Select } from './ui.jsx';
import { isDesk, PairSheet, ScanSheet } from './scan/ScanSheets.jsx';
import { takeHandoff } from './scan/handoff.js';

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

/** For a delivery: lines whose count differs from the note. A warning to read, not a stop. */
export function noteDifferences(lines) {
  const out = {};
  for (const l of lines) {
    const q = Number(l.qty);
    if (l.noteQty === undefined || l.noteQty === '' || l.noteQty === null || !(q > 0) || Number(l.noteQty) === q) continue;
    const d = +(q - Number(l.noteQty)).toFixed(3);
    out[l.key] = `${fmtQty(Math.abs(d))} ${l.item.uom} ${d < 0 ? 'short of' : 'more than'} the note`;
  }
  return out;
}

/**
 * `scan` (a purpose: use, take, transfer, receive, request) adds the Scan buttons, and takes any
 * items handed over from the Scan screen for that purpose.
 */
/** `notes` is one more line of text under an item, by item id: what was last paid for it, say. */
/** The packs a line can be written in on an order or a delivery: buying packs, this supplier's or anybody's. */
export const buyPacks = (item, supplierId) => (item.packs || []).filter((p) => p.use !== 'STORE' && (!p.supplierId || !supplierId || p.supplierId === supplierId));

export default function LineEditor({ mode, items, storeId, lines, setLines, currency = 'AED', showCost = false, pickerFilter, errors = {}, scan, withNote = false, warnings = {}, notes = {}, supplierId = null }) {
  const [scanning, setScanning] = useState(null);
  const fresh = (item, extra = {}) => newLine(item, { ...(mode === 'in' || mode === 'po' ? { unitCost: item.lastCost ?? item.avgCost ?? '' } : {}), ...extra });
  const add = (item) => {
    if (mode !== 'in' && lines.some((l) => l.item.id === item.id)) return;
    setLines([...lines, fresh(item)]);
  };
  /** A scan: one more of an item already on the list (its latest line, on a delivery), else a new line. */
  const bump = (item) => {
    if (pickerFilter && !pickerFilter(item)) return false;
    setLines((cur) => {
      const i = mode === 'in' ? cur.map((l) => l.item.id).lastIndexOf(item.id) : cur.findIndex((l) => l.item.id === item.id);
      if (i < 0) return [...cur, fresh(item)];
      return cur.map((l, j) => (j === i ? { ...l, qty: String((Number(l.qty) || 0) + 1) } : l));
    });
    return true;
  };
  useEffect(() => {
    const handed = scan && takeHandoff(scan);
    if (!handed) return;
    setLines((cur) => [...cur, ...handed.map((h) => {
      const it = items.find((i) => i.id === h.itemId);
      return it && (!pickerFilter || pickerFilter(it)) ? fresh(it, { qty: String(h.qty) }) : null;
    }).filter(Boolean)]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (key, patch) => setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const drop = (key) => setLines(lines.filter((l) => l.key !== key));
  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0), 0);

  return (
    <div className="inv-lines">
      {lines.map((l) => {
        const here = l.item.stores?.find((s) => s.storeId === storeId);
        const what = withNote ? 'Counted' : mode === 'adjust' ? 'Change' : 'How much';
        const packs = mode === 'in' || mode === 'po' ? buyPacks(l.item, supplierId) : [];
        // In the stepper, a pack is its first word ("carton"): "Carton of 24" pushed a phone's
        // line past the screen at 320 wide. "Written in" beside it says the whole pack.
        const unit = l.pack ? l.pack.label.split(/\s+/)[0].toLowerCase().slice(0, 10) : l.item.uom;
        const choosePack = (id) => {
          const pack = packs.find((p) => p.id === id) || null;
          const was = l.pack?.factor || 1;
          const base = l.unitCost === '' || l.unitCost === undefined ? null : Number(l.unitCost) / was;
          set(l.key, { packId: pack?.id || null, pack, ...(base === null ? {} : { unitCost: String(+(base * (pack?.factor || 1)).toFixed(4)) }) });
        };
        return (
          <div key={l.key} className="inv-line">
            <div className="inv-line__top">
              <div className="min0 grow">
                <span className="row-label">{l.item.name}</span>
                <span className="row-sub">
                  <code>{l.item.code}</code>
                  {here && mode !== 'in' && mode !== 'po' && <> · {fmtQty(here.qty)} {l.item.uom} in this store</>}
                  {mode === 'adjust' && <> · enter − to take away, + to add</>}
                </span>
                {l.noteText && <span className="row-sub">On the note: “{l.noteText}”{l.factor > 1 ? ` · 1 on the note = ${fmtQty(l.factor)} ${l.item.uom}` : ''}</span>}
                {notes[l.item.id] && <span className="row-sub">{notes[l.item.id]}</span>}
              </div>
              <button type="button" className="icon-btn" onClick={() => drop(l.key)} aria-label={`Remove ${l.item.name}`}><Icon name="close" size={20} /></button>
            </div>
            <div className="inv-line__fields">
              {mode === 'adjust'
                ? <QuantityField label={`${what}: ${l.item.name}`} hideLabel bare min={-999999} value={l.qty} unit={l.item.uom} onChange={(v) => set(l.key, { qty: v })} error={errors[l.key]} />
                : <QuantityField label={`${what}: ${l.item.name}`} hideLabel value={l.qty} unit={unit} onChange={(v) => set(l.key, { qty: v })} error={errors[l.key]} />}
              {packs.length > 0 && (
                <Field label="Written in" hint={l.pack ? `${fmtQty((Number(l.qty) || 0) * l.pack.factor)} ${l.item.uom} to the stock` : undefined}>
                  <Select value={l.packId || ''} onChange={choosePack} options={[{ value: '', label: l.item.uom }, ...packs.map((p) => ({ value: p.id, label: `${p.label} (${fmtQty(p.factor)} ${l.item.uom})` }))]} />
                </Field>
              )}
              {withNote && (
                <Field label="On the note" hint="What the delivery note says, if it differs from what you counted. Leave empty when they agree.">
                  <QtyInput value={l.noteQty ?? ''} onChange={(v) => set(l.key, { noteQty: v })} label="Quantity on the note" placeholder="Same" />
                </Field>
              )}
              {(mode === 'in' || mode === 'po') && showCost && (
                <Field label={l.pack ? `Cost per ${l.pack.label} (${currency})` : `Unit cost (${currency})`}>
                  <QtyInput value={l.unitCost} onChange={(v) => set(l.key, { unitCost: v })} label={l.pack ? `Cost per ${l.pack.label}` : 'Unit cost'} />
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
            {!errors[l.key] && warnings[l.key] && <div><Pill tone="warn">{warnings[l.key]}</Pill></div>}
          </div>
        );
      })}
      {(mode === 'in' || mode === 'po') && showCost && lines.length > 0 && (
        <p className="r"><span className="muted">Total </span><b>{fmtMoney(total, currency)}</b></p>
      )}
      <div className={lines.length ? 'inv-line inv-line--add' : 'inv-line--add'}>
        <ItemPicker items={items} storeId={storeId} onPick={add} filter={pickerFilter} label={lines.length ? 'Add another item' : 'Add an item'} showLabel
          placeholder="Type a name or a code" exclude={mode === 'in' ? [] : lines.map((l) => l.item.id)} />
        {scan && (
          <div className="scan-row">
            <Button kind="ghost" icon="scan" onClick={() => setScanning('camera')}>Scan</Button>
            {isDesk() && <Button kind="ghost" icon="phone" onClick={() => setScanning('phone')}>Scan with a phone</Button>}
          </div>
        )}
      </div>
      {scanning === 'camera' && <ScanSheet onItem={bump} filter={pickerFilter} onClose={() => setScanning(null)} />}
      {scanning === 'phone' && <PairSheet purpose={scan} onItem={bump} onClose={() => setScanning(null)} />}
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

export const toPayload = (lines, extra = () => ({})) => lines.map((l) => {
  const hasCost = l.unitCost !== undefined && l.unitCost !== '';
  // Written in a pack: the server works the item's own quantity and price out from the pack.
  const f = l.pack?.factor || 1;
  return {
    itemId: l.item.id, qty: +(Number(l.qty) * f).toFixed(3), ...(l.batchId ? { batchId: l.batchId } : {}),
    ...(hasCost ? { unitCost: +(Number(l.unitCost) / f).toFixed(4) } : {}),
    ...(l.pack ? { packId: l.pack.id, packQty: Number(l.qty), ...(hasCost ? { packCost: Number(l.unitCost) } : {}) } : {}),
    ...(l.expiry ? { expiry: l.expiry } : {}), ...(l.batchNo ? { batchNo: l.batchNo } : {}), ...extra(l),
  };
});
