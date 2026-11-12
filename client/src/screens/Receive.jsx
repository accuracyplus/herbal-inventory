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
import { Button, Card, ErrorNote, Field, ItemPicker, Loading, Note, Page, Pill, QtyInput, Select, useApp, useData } from '../ui.jsx';
import { useMyStores } from './Record.jsx';

const SOURCE = { remembered: ['ok', 'Remembered'], code: ['ok', 'By its code'], guess: ['warn', 'A guess: check it'] };
let fileKey = 0;

/** Photos and PDFs chosen for this delivery, each with what it is. Sent after the delivery is recorded. */
export function Paperwork({ files, setFiles, kinds, needNote }) {
  const add = (list, kind) => setFiles((cur) => [...cur, ...[...list].map((file) => ({ key: fileKey += 1, file, kind }))]);
  const has = (k) => files.some((f) => f.kind === k);
  return (
    <div className="stack">
      {needNote && !has('NOTE') && !has('INVOICE') && (
        <Note tone="warn" icon="alert"><span>A manager cannot approve this delivery until the delivery note is attached. For a purchase with no note, attach the invoice.</span></Note>
      )}
      <div className="scan-row">
        {Object.entries(kinds).filter(([k]) => k !== 'OTHER').map(([k, label]) => (
          <label key={k} className="hf-btn hf-btn--secondary file-btn">
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
                <button type="button" className="icon-btn" onClick={() => setFiles((cur) => cur.filter((x) => x.key !== f.key))} aria-label={`Remove ${f.file.name}`}><Icon name="close" size={20} /></button>
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
    <Card title="From the note: check each line" hint="Read from your photo. Choose the item for any line that is not matched, and say how many of ours one on the note is. What you confirm is remembered for this supplier.">
      <div className="inv-lines">
        {read.lines.map((l) => {
          const item = items.find((i) => i.id === l.itemId);
          return (
            <div key={l.key} className="inv-line">
              <div className="inv-line__top">
              <div className="min0 grow">
                <span className="row-label">“{l.text}”</span>
                <span className="row-sub">{l.qty ? `${fmtQty(l.qty)} ${l.unit || ''}` : 'no quantity read'}{l.unitPrice !== null ? ` at ${fmtMoney(l.unitPrice, '', 2).trim()}` : ''}</span>
              </div>
              <button type="button" className="icon-btn" onClick={() => setRead((r) => ({ ...r, lines: r.lines.filter((x) => x.key !== l.key) }))} aria-label={`Leave out ${l.text}`}><Icon name="close" size={20} /></button>
              </div>
              <div className="inv-line__fields">
                {item
                  ? (
                    <Field label="Is our item">
                      <div className="row"><span className="grow min0"><b>{item.name}</b> {l.source && <Pill tone={SOURCE[l.source][0]}>{SOURCE[l.source][1]}</Pill>}</span>
                        <Button kind="ghost" onClick={() => set(l.key, { itemId: null, source: null })}>Change</Button></div>
                    </Field>
                  )
                  : <Field label="Which item is this?"><ItemPicker items={items} onPick={(it) => set(l.key, { itemId: it.id, source: null })} filter={(i) => !i.isLinen} placeholder="Type a name or a code" /></Field>}
                <Field label="Quantity on the note"><QtyInput value={l.qty ?? ''} onChange={(v) => set(l.key, { qty: v })} /></Field>
                {item && <Field label={`1 ${l.unit || 'on the note'} = how many ${item.uom}`} hint="For a box of 12 bottles counted as bottles, enter 12."><QtyInput value={l.factor} onChange={(v) => set(l.key, { factor: v })} /></Field>}
              </div>
              {item && Number(l.qty) > 0 && Number(l.factor) > 0 && <span className="row-sub">That is {fmtQty(Number(l.qty) * Number(l.factor))} {item.uom} to count.</span>}
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
  const [tried, setTried] = useState(false);
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
      toast(`${r.lines.length} line${r.lines.length === 1 ? '' : 's'} read. Check them below.`);
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
  const bad = lines.map((l, i) => (errors[l.key] ? i + 1 : 0)).filter(Boolean);
  const missing = !lines.length ? ['at least one item that arrived'] : bad.length ? [`what is marked on line ${bad.join(' and ')}`] : [];
  const save = async () => {
    if (missing.length) { setTried(true); return; }
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
      setLines([]); setFiles([]); setRead(null); setNoteNo(''); setNoteDate(''); setInvoiceNo(''); setInvoiceDate(''); setNote(''); setPoId(''); setTried(false);
      refreshStock(); refreshBadges();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <Page title="Receive a delivery">
        <Card>
          <div className="row"><span className="inv-done"><Icon name="check" /></span>
            <h2 className="grow">{done.ref} recorded{showCost ? `, ${fmtMoney(done.total, currency)}` : ''}.</h2></div>
          {done.status === 'PENDING'
            ? <p>It is waiting for a manager's approval. The stock is on the shelf once it is approved.</p>
            : <p>The stock is on the shelf.</p>}
          {done.status === 'PENDING' && needNote && !done.hasNote && <Note tone="warn" icon="alert"><span>No delivery note is attached yet, so it cannot be approved. Open the delivery and attach it.</span></Note>}
          {done.failed.length > 0 && <Note tone="danger" icon="alert" role="alert"><div><b>These files were not attached:</b><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{done.failed.map((f) => <li key={f}>{f}</li>)}</ul>Open the delivery and add them again.</div></Note>}
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
        <Card title="The delivery note" hint="Photograph it and the supplier, note number and lines are read from the photo and shown for you to check. Nothing is saved until you press the button at the foot of the page.">
          <div className="scan-row">
            <label className={`hf-btn hf-btn--secondary file-btn ${reading ? 'busy' : ''}`}>
              <Icon name="camera" size={18} /><span>{reading ? 'Reading the note…' : 'Photograph the delivery note'}</span>
              <input type="file" accept="image/*" capture="environment" disabled={reading} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) readPhoto(f); }} />
            </label>
          </div>
          {reading && <Loading what="Reading the note, about ten seconds" />}
          {read && !read.supplier.id && read.supplier.text && !supplierId && (
            <Note icon="help"><span>The note is from “{read.supplier.text}”, which is not one of this unit's suppliers by that name. Choose the supplier below so its wording is remembered.</span></Note>
          )}
        </Card>
      )}
      {read && <ReadLines read={read} setRead={setRead} items={stock.items} onUse={useRead} />}
      <Card>
        <div className="form two">
          <Field label="Against an order (optional)" hint="Choose the order this delivery is for, and its lines fill in. Leave empty for a purchase made without one.">
            <Select value={poId} onChange={(v) => { setPoId(v); if (!v) setLines([]); }} placeholder={open.length ? 'No order: a local purchase' : 'No open orders'}
              options={open.map((p) => ({ value: p.id, label: `${p.ref} · ${p.supplier_name}` }))} />
          </Field>
          <Field label="Goes into"><Select value={storeId} onChange={setStoreId} disabled={!!poId} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Supplier (optional)"><Select value={supplierId} onChange={setSupplierId} disabled={!!poId} placeholder="Not recorded" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Note number"><input value={noteNo} onChange={(e) => setNoteNo(e.target.value)} placeholder="As printed on the note" maxLength={60} /></Field>
          <Field label="Date on the note"><input type="date" value={noteDate} max={gstToday()} onChange={(e) => setNoteDate(e.target.value)} /></Field>
          <Field label="Invoice number (optional)"><input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} maxLength={60} /></Field>
          <Field label="Invoice date (optional)"><input type="date" value={invoiceDate} max={gstToday()} onChange={(e) => setInvoiceDate(e.target.value)} /></Field>
          <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></Field>
        </div>
        {lists.stores.length === 0 && <Note tone="warn">No store is set up yet.</Note>}
      </Card>
      <Card title="What arrived">
        <LineEditor mode="in" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} errors={errors} warnings={warnings} showCost={showCost} currency={currency} scan="receive" withNote />
      </Card>
      <Card title="Paperwork" hint="Photos or PDFs of the delivery note, the supplier's invoice and the LPO. Each is kept with who attached it and when.">
        {me.has?.files === false
          ? <Note tone="warn" icon="alert"><span>File storage is not set up for this app yet, so nothing can be attached. Tell your administrator.</span></Note>
          : <Paperwork files={files} setFiles={setFiles} kinds={kinds} needNote={needNote} />}
      </Card>
      <ErrorNote error={err} />
      {tried && missing.length > 0 && <Note tone="warn" icon="alert" role="alert">Still needed: {missing.join(', ')}.</Note>}
      <div className="inv-submit">
        <Button busy={busy} onClick={save} icon="receive">{twoStep ? 'Send for approval' : 'Receive'}</Button>
      </div>
    </Page>
  );
}
