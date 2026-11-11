/**
 * Receive a delivery: what arrived, counted against the delivery note, with its paperwork.
 *
 * The receiver records it here. Unless the unit has switched approval off, a manager then
 * approves it on Purchasing → Deliveries, and only then is the stock on the shelf.
 *
 * A photo of the note can be read to fill the form in. What comes back is a suggestion: every
 * line is shown for the receiver to check, and nothing is saved until they press Receive.
 */

import { useEffect, useState } from 'react';
import { fmtMoney, fmtQty, get, gstToday, post, sendForm, shrinkImage } from '../api.js';
import Icon from '../icons.jsx';
import LineEditor, { lineErrors, newLine, noteDifferences, toPayload } from '../lines.jsx';
import { Button, Card, ErrorNote, Field, ItemPicker, Loading, Page, Pill, QtyInput, Select, useApp, useData } from '../ui.jsx';
import { useMyStores } from './Record.jsx';

const SOURCE = { remembered: ['ok', 'Remembered'], code: ['ok', 'By its code'], guess: ['warn', 'A guess — check it'] };
let fileKey = 0;

/** Photos and PDFs chosen for this delivery, each with what it is. Sent after the delivery is recorded. */
export function Paperwork({ files, setFiles, kinds, needNote }) {
  const add = (list, kind) => setFiles((cur) => [...cur, ...[...list].map((file) => ({ key: fileKey += 1, file, kind }))]);
  const has = (k) => files.some((f) => f.kind === k);
  return (
    <div className="stack">
      {needNote && !has('NOTE') && !has('INVOICE') && (
        <div className="note warn"><Icon name="alert" size={18} /><span>A manager cannot approve this delivery until the delivery note is attached. For a purchase with no note, attach the invoice.</span></div>
      )}
      <div className="scan-row">
        {Object.entries(kinds).filter(([k]) => k !== 'OTHER').map(([k, label]) => (
          <label key={k} className="btn btn-secondary file-btn">
            <Icon name="plus" size={18} /><span>{label}</span>
            <input type="file" accept="image/*,application/pdf" multiple onChange={(e) => { add(e.target.files, k); e.target.value = ''; }} />
          </label>
        ))}
      </div>
      {files.length > 0 && (
        <ul className="lots">
          {files.map((f) => (
            <li key={f.key} className="lot">
              <div className="min0"><span className="row-label">{f.file.name}</span><span className="row-sub">{Math.max(1, Math.round(f.file.size / 1024))} KB</span></div>
              <div className="lot-actions">
                <Select value={f.kind} onChange={(v) => setFiles((cur) => cur.map((x) => (x.key === f.key ? { ...x, kind: v } : x)))} options={Object.entries(kinds).map(([value, label]) => ({ value, label }))} aria-label="What this file is" />
                <button className="icon-btn" onClick={() => setFiles((cur) => cur.filter((x) => x.key !== f.key))} aria-label={`Remove ${f.file.name}`}><Icon name="trash" size={18} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** What was read from the note, line by line, for the receiver to match and confirm. */
function ReadLines({ read, setRead, items, onUse }) {
  const set = (key, patch) => setRead((r) => ({ ...r, lines: r.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  const ready = read.lines.filter((l) => l.itemId && Number(l.qty) > 0 && Number(l.factor) > 0);
  return (
    <Card title="From the note — check each line" hint="Read from your photo. Choose the item for any line that is not matched, and say how many of ours one on the note is. What you confirm is remembered for this supplier.">
      <div className="lines">
        {read.lines.map((l) => {
          const item = items.find((i) => i.id === l.itemId);
          return (
            <div key={l.key} className={`line ${item ? '' : 'warn'}`}>
              <div className="min0">
                <div className="line-name">“{l.text}”</div>
                <div className="line-sub">{l.qty ? `${fmtQty(l.qty)} ${l.unit || ''}` : 'no quantity read'}{l.unitPrice !== null ? ` at ${fmtMoney(l.unitPrice, '', 2).trim()}` : ''}</div>
              </div>
              <button className="icon-btn" onClick={() => setRead((r) => ({ ...r, lines: r.lines.filter((x) => x.key !== l.key) }))} aria-label={`Leave out ${l.text}`}><Icon name="trash" size={18} /></button>
              <div className="line-fields">
                {item
                  ? (
                    <Field label="Is our item">
                      <div className="row"><span className="grow min0"><b>{item.name}</b> {l.source && <Pill tone={SOURCE[l.source][0]}>{SOURCE[l.source][1]}</Pill>}</span>
                        <Button kind="ghost" onClick={() => set(l.key, { itemId: null, source: null })}>Change</Button></div>
                    </Field>
                  )
                  : <Field label="Which item is this?"><ItemPicker items={items} onPick={(it) => set(l.key, { itemId: it.id, source: null })} filter={(i) => !i.isLinen} placeholder="Find the item — name or code" /></Field>}
                <Field label="Quantity on the note"><QtyInput value={l.qty ?? ''} onChange={(v) => set(l.key, { qty: v })} /></Field>
                {item && <Field label={`1 ${l.unit || 'on the note'} = how many ${item.uom}`} hint="For a box of 12 bottles counted as bottles, enter 12."><QtyInput value={l.factor} onChange={(v) => set(l.key, { factor: v })} /></Field>}
              </div>
              {item && Number(l.qty) > 0 && Number(l.factor) > 0 && <div className="line-sub">= {fmtQty(Number(l.qty) * Number(l.factor))} {item.uom} to count</div>}
            </div>
          );
        })}
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button kind="ghost" onClick={() => setRead(null)}>Discard what was read</Button>
        <Button icon="check" onClick={() => onUse(ready)}>{ready.length ? `Add ${ready.length} line${ready.length === 1 ? '' : 's'} to the delivery` : 'Add to the delivery'}</Button>
      </div>
    </Card>
  );
}

export default function ReceiveScreen() {
  const { me, stock, lists, route, navigate, refreshStock, refreshBadges, toast, can, currency } = useApp();
  const stores = useMyStores('MAIN');
  const { data: suppliers } = useData('/api/suppliers');
  const { data: pos } = useData('/api/pos?status=OPEN');
  const open = (pos || []).filter((p) => ['APPROVED', 'PARTLY_RECEIVED'].includes(p.status));
  const [poId, setPoId] = useState(route.query.get('po') || '');
  const [storeId, setStoreId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [noteNo, setNoteNo] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([]);
  const [files, setFiles] = useState([]);
  const [read, setRead] = useState(null);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  const showCost = can('cost.view') || can('receive');
  const twoStep = me.settings['receipts.approval'] !== 'none';
  const needNote = twoStep && me.settings['receipts.note'] !== 'optional';
  const canRead = me.has?.reading && me.settings['receipts.read_notes'] !== 'off';
  const kinds = me.labels.fileKinds;
  useEffect(() => { if (!storeId && stores[0]) setStoreId(stores[0].id); }, [stores, storeId]);

  // Choosing a purchase order fills the store, supplier and the lines still to come.
  useEffect(() => {
    if (!poId || !stock) return;
    get(`/api/pos/${poId}`).then((po) => {
      setStoreId(po.store_id); setSupplierId(po.supplier_id);
      setLines(po.lines.filter((l) => l.received_qty < l.qty).map((l) => {
        const item = stock.items.find((i) => i.id === l.item_id);
        return item ? newLine(item, { qty: String(+(l.qty - l.received_qty).toFixed(3)), unitCost: l.unit_cost }) : null;
      }).filter(Boolean));
    }).catch((e) => setErr(e));
  }, [poId, stock]);

  if (!stock) return <Page title="Receive a delivery"><Loading /></Page>;

  const readPhoto = async (file) => {
    setErr(null); setReading(true);
    try {
      const r = await sendForm('/api/receipts/read', { file: await shrinkImage(file, 1600, 0.8), supplierId });
      if (r.supplier.id && !poId) setSupplierId(r.supplier.id);
      if (r.noteNo) setNoteNo((v) => v || r.noteNo);
      if (r.date) setNoteDate((v) => v || r.date);
      setRead({ supplier: r.supplier, lines: r.lines.map((l, i) => ({ key: i, text: l.text, qty: l.qty ?? '', unit: l.unit, unitPrice: l.unitPrice, itemId: l.match?.itemId || null, factor: l.match?.factor || 1, source: l.match?.source || null })) });
      // The photo that was read is the delivery note: keep it with the delivery.
      setFiles((cur) => [...cur, { key: fileKey += 1, file, kind: 'NOTE' }]);
      toast(`${r.lines.length} line${r.lines.length === 1 ? '' : 's'} read — check them below`);
    } catch (e) { setErr(e); } finally { setReading(false); }
  };

  /** Confirmed lines from the note go onto the delivery: counted starts as what the note says. */
  const useRead = (ready) => {
    if (!ready.length) { setErr(new Error('Choose the item for at least one line first.')); return; }
    setLines((cur) => {
      let next = [...cur];
      for (const l of ready) {
        const item = stock.items.find((i) => i.id === l.itemId);
        const qty = +(Number(l.qty) * Number(l.factor)).toFixed(3);
        const fromNote = {
          qty: String(qty), noteQty: String(qty), noteText: l.text, factor: Number(l.factor),
          ...(l.unitPrice !== null && l.unitPrice !== undefined ? { unitCost: +(l.unitPrice / Number(l.factor)).toFixed(4) } : {}),
        };
        const at = next.findIndex((x) => x.item.id === item.id && !x.noteText);
        next = at >= 0 ? next.map((x, i) => (i === at ? { ...x, ...fromNote } : x)) : [...next, newLine(item, { unitCost: item.lastCost ?? item.avgCost ?? '', ...fromNote })];
      }
      return next;
    });
    const used = new Set(ready.map((l) => l.key));
    setRead((r) => (r.lines.some((l) => !used.has(l.key)) ? { ...r, lines: r.lines.filter((l) => !used.has(l.key)) } : null));
  };

  const errors = lineErrors(lines, 'in', storeId);
  const warnings = noteDifferences(lines);
  const save = async () => {
    if (!lines.length) { setErr(new Error('Add at least one item that arrived.')); return; }
    if (Object.keys(errors).length) { setErr(new Error('Some lines need attention before this can be recorded: see the lines marked below.')); return; }
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/receipts', {
        storeId, supplierId: supplierId || null, poId: poId || null, noteNo, noteDate: noteDate || null, invoiceNo, invoiceDate: invoiceDate || null, note,
        lines: toPayload(lines, (l) => ({ noteQty: l.noteQty === '' || l.noteQty === undefined ? null : Number(l.noteQty), noteText: l.noteText || null, factor: l.factor || 1 })),
      });
      // The delivery is recorded; a file that fails to send is said, and can be added afterwards.
      const failed = [];
      for (const f of files) {
        try { await sendForm(`/api/receipts/${r.id}/files`, { kind: f.kind, file: await shrinkImage(f.file) }); } catch (e) { failed.push(`${f.file.name}: ${e.message}`); }
      }
      setDone({ ...r, failed, attached: files.length - failed.length, hasNote: files.some((f) => ['NOTE', 'INVOICE'].includes(f.kind) && !failed.some((x) => x.startsWith(f.file.name))) });
      toast(`${r.ref} recorded`);
      setLines([]); setFiles([]); setRead(null); setNoteNo(''); setNoteDate(''); setInvoiceNo(''); setInvoiceDate(''); setNote(''); setPoId('');
      refreshStock(); refreshBadges();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <Page title="Receive a delivery">
        <Card>
          <div className="row"><span className="row-icon tone-ok"><Icon name="check" /></span>
            <h2 className="grow">{done.ref} recorded{showCost ? ` — ${fmtMoney(done.total, currency)}` : ''}.</h2></div>
          {done.status === 'PENDING'
            ? <p>It is waiting for a manager's approval. The stock is on the shelf once it is approved.</p>
            : <p>The stock is on the shelf.</p>}
          {done.status === 'PENDING' && needNote && !done.hasNote && <div className="note warn"><Icon name="alert" size={18} /><span>No delivery note is attached yet, so it cannot be approved. Open the delivery and attach it.</span></div>}
          {done.failed.length > 0 && <div className="note danger"><Icon name="alert" size={18} /><div><b>These files were not attached:</b><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{done.failed.map((f) => <li key={f}>{f}</li>)}</ul>Open the delivery and add them again.</div></div>}
          <div className="row">
            <Button onClick={() => setDone(null)}>Record another</Button>
            <Button kind="secondary" onClick={() => navigate(`purchasing/d/${done.id}`)}>Open {done.ref}</Button>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Receive a delivery" subtitle={twoStep ? 'Count what arrived against the delivery note. A manager approves it before it is on the shelf.' : 'Goods in: from a purchase order, or a local purchase.'}>
      {canRead && (
        <Card title="Start from a photo of the note" hint="The supplier, note number and lines are read from the photo and shown for you to check. Nothing is saved until you press Receive.">
          <div className="scan-row">
            <label className={`btn btn-secondary file-btn ${reading ? 'busy' : ''}`}>
              <Icon name="scan" size={18} /><span>{reading ? 'Reading the note…' : 'Photograph the delivery note'}</span>
              <input type="file" accept="image/*" capture="environment" disabled={reading} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) readPhoto(f); }} />
            </label>
          </div>
          {reading && <Loading what="Reading the note, about ten seconds" />}
          {read && !read.supplier.id && read.supplier.text && !supplierId && (
            <div className="note"><Icon name="help" size={18} /><span>The note is from “{read.supplier.text}”, which is not one of this unit's suppliers by that name. Choose the supplier below so its wording is remembered.</span></div>
          )}
        </Card>
      )}
      {read && <ReadLines read={read} setRead={setRead} items={stock.items} onUse={useRead} />}
      <Card>
        <div className="form two">
          <Field label="Purchase order" hint="Choose the order this delivery is for, and its lines fill in. Leave empty for a purchase made without one.">
            <Select value={poId} onChange={(v) => { setPoId(v); if (!v) setLines([]); }} placeholder={open.length ? 'No order — local purchase' : 'No open orders'}
              options={open.map((p) => ({ value: p.id, label: `${p.ref} · ${p.supplier_name}` }))} />
          </Field>
          <Field label="Into store"><Select value={storeId} onChange={setStoreId} disabled={!!poId} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Supplier"><Select value={supplierId} onChange={setSupplierId} disabled={!!poId} placeholder="Not recorded" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Delivery note number"><input value={noteNo} onChange={(e) => setNoteNo(e.target.value)} placeholder="As printed on the note" maxLength={60} /></Field>
          <Field label="Delivery note date"><input type="date" value={noteDate} max={gstToday()} onChange={(e) => setNoteDate(e.target.value)} /></Field>
          <Field label="Invoice number"><input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Optional" maxLength={60} /></Field>
          <Field label="Invoice date"><input type="date" value={invoiceDate} max={gstToday()} onChange={(e) => setInvoiceDate(e.target.value)} /></Field>
          <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" maxLength={300} /></Field>
        </div>
        {lists.stores.length === 0 && <div className="note warn">No store is set up yet.</div>}
      </Card>
      <Card title="Items received">
        <LineEditor mode="in" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} errors={errors} warnings={warnings} showCost={showCost} currency={currency} scan="receive" withNote />
      </Card>
      <Card title="Paperwork" hint="Photos or PDFs of the delivery note, the supplier's invoice and the LPO. Each is kept with who attached it and when.">
        {me.has?.files === false
          ? <div className="note warn"><Icon name="alert" size={18} /><span>File storage is not set up for this app yet, so nothing can be attached. Tell your administrator.</span></div>
          : <Paperwork files={files} setFiles={setFiles} kinds={kinds} needNote={needNote} />}
      </Card>
      <ErrorNote error={err} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button busy={busy} onClick={save} icon="receive">{twoStep ? 'Record for approval' : 'Receive'}</Button>
      </div>
    </Page>
  );
}
