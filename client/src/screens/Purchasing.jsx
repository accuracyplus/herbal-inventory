/**
 * Purchasing: what to buy, purchase orders from draft to delivery, and suppliers.
 */

import { useState } from 'react';
import { fmtDate, fmtDateTime, fmtMoney, fmtQty, post, put } from '../api.js';
import Icon from '../icons.jsx';
import LineEditor, { newLine, toPayload } from '../lines.jsx';
import {
  Button, Card, Check, ErrorNote, Field, Loading, Page, Pill, Quiet, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';

export default function Purchasing() {
  const { route, navigate, can } = useApp();
  const [tab, setTab] = useState(route.query.get('tab') || 'orders');
  const [status, setStatus] = useState(route.query.get('status') || 'OPEN');
  const [editing, setEditing] = useState(null);
  const { data, error, loading, reload } = useData(tab === 'orders' ? `/api/pos${status ? `?status=${status}` : ''}` : null, [status, tab]);

  return (
    <Page title="Purchasing" subtitle="Reorder suggestions, purchase orders and suppliers."
      actions={can('po.edit') && tab === 'orders' && <Button icon="plus" onClick={() => setEditing({})}>New order</Button>}>
      <Segmented label="Section" value={tab} onChange={setTab} options={[
        { value: 'orders', label: 'Orders' }, ...(can('po.edit') ? [{ value: 'suggest', label: 'What to buy' }] : []), { value: 'suppliers', label: 'Suppliers' },
      ]} />
      {tab === 'orders' && (
        <>
          <Segmented label="Show" value={status} onChange={setStatus} options={[
            { value: 'OPEN', label: 'Open' }, { value: 'SUBMITTED', label: 'To approve' }, { value: 'APPROVED', label: 'Expected' },
            { value: 'RECEIVED', label: 'Received' }, { value: '', label: 'All' },
          ]} />
          <ErrorNote error={error} onRetry={reload} />
          {loading && !data && <Loading />}
          {data && (
            <Card pad={false}>
              <Table rows={data} onRow={(p) => navigate(`purchasing/${p.id}`)} empty="No purchase orders here." columns={[
                { key: 'ref', label: 'Order', primary: true, render: (p) => <span className="min0"><span className="row-label">{p.ref}</span><span className="row-sub">{p.supplier_name} · {p.line_count} line{p.line_count === 1 ? '' : 's'}</span></span> },
                { key: 'store_name', label: 'Deliver to' },
                { key: 'expected_date', label: 'Expected', render: (p) => (p.expected_date ? fmtDate(p.expected_date) : '—') },
                { key: 'total', label: 'Total', align: 'right', render: (p) => fmtMoney(p.total) },
                { key: 'status', label: 'Status', render: (p) => <Pill status={p.status} /> },
              ]} />
            </Card>
          )}
        </>
      )}
      {tab === 'suggest' && <Suggestions onDraft={(prefill) => { setEditing(prefill); setTab('orders'); }} />}
      {tab === 'suppliers' && <Suppliers />}
      {route.id && <PoSheet id={route.id} onClose={() => navigate('purchasing')} onChanged={reload} onEdit={(po) => setEditing(po)} />}
      {editing && <PoEditor po={editing} onClose={() => setEditing(null)} onSaved={(id) => { setEditing(null); reload(); navigate(`purchasing/${id}`); }} />}
    </Page>
  );
}

function Suggestions({ onDraft }) {
  const { lists, stock, currency } = useApp();
  const mains = lists.stores.filter((s) => s.kind === 'MAIN');
  const [storeId, setStoreId] = useState(mains[0]?.id || lists.stores[0]?.id || '');
  const { data, error, loading } = useData(storeId ? `/api/pos/suggestions?store=${storeId}` : null, [storeId]);
  const bySupplier = {};
  for (const r of data || []) (bySupplier[r.supplier_id || ''] ||= { name: r.supplier_name || 'No usual supplier', rows: [] }).rows.push(r);
  return (
    <>
      <Card>
        <Field label="For store" hint="Items at or below their reorder level here, topped up to par, less what is already on an open order.">
          <Select value={storeId} onChange={setStoreId} options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
      </Card>
      <ErrorNote error={error} />
      {loading && <Loading />}
      {data && !data.length && <Card><Quiet>Nothing needs ordering for this store.</Quiet></Card>}
      {Object.entries(bySupplier).map(([sid, g]) => (
        <Card key={sid} title={g.name} actions={stock && <Button className="sm" icon="purchasing" onClick={() => onDraft({
          supplier_id: sid || '', store_id: storeId,
          lines: g.rows.map((r) => ({ item_id: r.item_id, qty: r.suggest, unit_cost: r.unit_cost })),
        })}>Draft an order</Button>}>
          <Table rows={g.rows} rowKey={(r) => r.item_id} columns={[
            { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code></span></span> },
            { key: 'on_hand', label: 'On hand', align: 'right', render: (r) => fmtQty(r.on_hand) },
            { key: 'on_order', label: 'On order', align: 'right', render: (r) => fmtQty(r.on_order) },
            { key: 'reorder', label: 'Reorder at', align: 'right', render: (r) => fmtQty(r.reorder) },
            { key: 'suggest', label: 'Buy', align: 'right', render: (r) => <b>{fmtQty(r.suggest)} {r.uom}</b> },
            { key: 'cost', label: 'Est.', align: 'right', render: (r) => fmtMoney(r.suggest * (r.unit_cost || 0), currency) },
          ]} />
        </Card>
      ))}
    </>
  );
}

function PoEditor({ po, onClose, onSaved }) {
  const { lists, stock, currency, toast } = useApp();
  const { data: suppliers } = useData('/api/suppliers');
  const [supplierId, setSupplierId] = useState(po.supplier_id || '');
  const [storeId, setStoreId] = useState(po.store_id || lists.stores.find((s) => s.kind === 'MAIN')?.id || '');
  const [expected, setExpected] = useState(po.expected_date || '');
  const [note, setNote] = useState(po.note || '');
  const [lines, setLines] = useState(() => (po.lines || []).map((l) => {
    const it = stock?.items.find((i) => i.id === l.item_id);
    return it ? newLine(it, { qty: String(l.qty), unitCost: l.unit_cost }) : null;
  }).filter(Boolean));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  if (!stock) return null;
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const body = { supplierId, storeId, expectedDate: expected || null, note, lines: toPayload(lines) };
      const r = po.id ? await put(`/api/pos/${po.id}`, body) : await post('/api/pos', body);
      toast(po.id ? `${r.ref} saved` : `${r.ref} drafted`);
      onSaved(r.id);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet wide title={po.id ? `Edit ${po.ref}` : 'New purchase order'} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} disabled={!supplierId || !lines.length} onClick={save}>Save draft</Button></>}>
      <div className="form two">
        <Field label="Supplier"><Select value={supplierId} onChange={setSupplierId} placeholder="Choose" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Deliver to"><Select value={storeId} onChange={setStoreId} options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Expected by"><input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
        <Field label="Note to supplier"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Optional" /></Field>
      </div>
      {suppliers && !suppliers.length && <div className="note warn"><Icon name="alert" size={18} />Add a supplier first, on the Suppliers tab.</div>}
      <LineEditor mode="po" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} showCost currency={currency} />
      <ErrorNote error={err} />
    </Sheet>
  );
}

function PoSheet({ id, onClose, onChanged, onEdit }) {
  const { me, can, toast, navigate, refreshBadges, currency } = useApp();
  const { data: po, error, loading, reload } = useData(`/api/pos/${id}`);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const act = async (action, msg) => {
    setBusy(true); setErr(null);
    try { await post(`/api/pos/${id}/${action}`, { note }); toast(msg); reload(); onChanged(); refreshBadges(); setNote(''); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const mine = po && po.created_by === me.staffId;
  return (
    <Sheet wide title={po ? `${po.ref} · ${po.supplier_name}` : 'Purchase order'} onClose={onClose}
      footer={po && <>
        <Button kind="ghost" icon="download" onClick={() => printPo(po, me, currency)}>Print / PDF</Button>
        {['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].includes(po.status) && can('po.edit') && !po.receipts.length && <Button kind="ghost" busy={busy} onClick={() => act('cancel', 'Order cancelled')}>Cancel order</Button>}
        {['DRAFT', 'REJECTED'].includes(po.status) && can('po.edit') && <Button kind="secondary" icon="edit" onClick={() => onEdit(po)}>Edit</Button>}
        {po.status === 'DRAFT' && can('po.edit') && <Button busy={busy} onClick={() => act('submit', 'Sent for approval')}>Submit for approval</Button>}
        {po.status === 'SUBMITTED' && can('po.decide') && <><Button kind="secondary" busy={busy} onClick={() => act('reject', 'Sent back')}>Send back</Button><Button busy={busy} onClick={() => act('approve', 'Order approved')}>Approve</Button></>}
        {po.status === 'PARTLY_RECEIVED' && can('receive') && <Button kind="secondary" busy={busy} onClick={() => act('close', 'Order closed short')}>Close short</Button>}
        {['APPROVED', 'PARTLY_RECEIVED'].includes(po.status) && can('receive') && <Button icon="receive" onClick={() => navigate(`receive?po=${po.id}`)}>Receive delivery</Button>}
      </>}>
      <ErrorNote error={error} />
      {loading && <Loading />}
      {po && (
        <>
          <div className="row"><Pill status={po.status} /><span className="muted">{fmtMoney(po.total, currency)}</span></div>
          <dl className="dl">
            <dt>Supplier</dt><dd>{po.supplier_name}{po.supplier_contact ? ` · ${po.supplier_contact}` : ''}{po.supplier_phone ? ` · ${po.supplier_phone}` : ''}</dd>
            <dt>Deliver to</dt><dd>{po.store_name}</dd>
            {po.expected_date && <><dt>Expected</dt><dd>{fmtDate(po.expected_date)}</dd></>}
            <dt>Raised</dt><dd>{po.created_by_name}, {fmtDateTime(po.created_at)}</dd>
            {po.decided_at && <><dt>{po.status === 'REJECTED' ? 'Sent back' : 'Approved'}</dt><dd>{po.decided_by_name}, {fmtDateTime(po.decided_at)}{po.decision_note ? ` — “${po.decision_note}”` : ''}</dd></>}
            {po.note && <><dt>Note</dt><dd>{po.note}</dd></>}
          </dl>
          <Card pad={false}>
            <Table rows={po.lines} columns={[
              { key: 'name', label: 'Item', primary: true, render: (l) => <span className="min0"><span className="row-label">{l.name}</span><span className="row-sub"><code>{l.code}</code></span></span> },
              { key: 'qty', label: 'Ordered', align: 'right', render: (l) => `${fmtQty(l.qty)} ${l.uom}` },
              { key: 'unit_cost', label: 'Price', align: 'right', render: (l) => fmtMoney(l.unit_cost, currency) },
              { key: 'line', label: 'Line total', align: 'right', render: (l) => fmtMoney(l.qty * l.unit_cost, currency) },
              { key: 'received_qty', label: 'Received', align: 'right', render: (l) => fmtQty(l.received_qty) },
            ]} />
          </Card>
          {po.receipts.length > 0 && (
            <Card title="Deliveries">
              <ul className="timeline">{po.receipts.map((r) => <li key={r.id}><span><b>{r.ref}</b> · {fmtMoney(r.total, currency)}{r.invoice_no ? ` · invoice ${r.invoice_no}` : ''}<span className="row-sub">{r.by_name}, {fmtDateTime(r.at)}</span></span></li>)}</ul>
            </Card>
          )}
          {po.status === 'SUBMITTED' && can('po.decide') && mine && <div className="note"><Icon name="alert" size={18} />You raised this order, so another manager approves it — unless you are the only one.</div>}
          {(['SUBMITTED', 'PARTLY_RECEIVED'].includes(po.status) || ['DRAFT', 'APPROVED'].includes(po.status)) && (
            <Field label="Note" hint="Required when sending back or closing short."><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
          )}
          <ErrorNote error={err} />
        </>
      )}
    </Sheet>
  );
}

/** A clean purchase order for the supplier: print it or save it as PDF from the browser. */
function printPo(po, me, currency) {
  const w = window.open('', '_blank');
  if (!w) return;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = po.lines.map((l) => `<tr><td>${esc(l.code)}</td><td>${esc(l.name)}</td><td class=r>${fmtQty(l.qty)} ${esc(l.uom)}</td><td class=r>${fmtMoney(l.unit_cost, currency)}</td><td class=r>${fmtMoney(l.qty * l.unit_cost, currency)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(po.ref)}</title>
<style>body{font:14px/1.5 Inter,Arial,sans-serif;color:#111;margin:40px}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin-top:18px}
th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}th{font-size:12px;text-transform:uppercase;color:#555}.r{text-align:right}.top{display:flex;justify-content:space-between;gap:24px}
.muted{color:#555}.tot{font-weight:700;font-size:16px}@media print{body{margin:16mm}}</style></head><body>
<div class=top><div><h1>Purchase order ${esc(po.ref)}</h1><div class=muted>${esc(me.unit.name)} · raised ${fmtDate(po.created_at)} by ${esc(po.created_by_name)}</div></div>
<div class=r><b>${esc(po.supplier_name)}</b><br>${esc(po.supplier_contact || '')}<br>${esc(po.supplier_phone || '')}<br>${esc(po.supplier_email || '')}${po.supplier_trn ? `<br>TRN ${esc(po.supplier_trn)}` : ''}</div></div>
<p><b>Deliver to:</b> ${esc(po.store_name)}, ${esc(me.unit.name)}${po.expected_date ? ` · <b>by</b> ${fmtDate(po.expected_date)}` : ''}</p>
${po.note ? `<p><b>Note:</b> ${esc(po.note)}</p>` : ''}
<table><thead><tr><th>Code</th><th>Item</th><th class=r>Qty</th><th class=r>Price</th><th class=r>Total</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td colspan=4 class="r tot">Total</td><td class="r tot">${fmtMoney(po.total, currency)}</td></tr></tfoot></table>
${po.decided_by_name && po.status !== 'REJECTED' ? `<p class=muted>Approved by ${esc(po.decided_by_name)} on ${fmtDate(po.decided_at)}.</p>` : '<p class=muted>Not yet approved.</p>'}
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

function Suppliers() {
  const { can } = useApp();
  const [all, setAll] = useState(false);
  const { data, error, loading, reload } = useData(`/api/suppliers${all ? '?all=1' : ''}`, [all]);
  const [editing, setEditing] = useState(null);
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Check checked={all} onChange={setAll}>Show inactive suppliers</Check>
        {can('supplier.edit') && <Button icon="plus" kind="secondary" onClick={() => setEditing({})}>New supplier</Button>}
      </div>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} onRow={can('supplier.edit') ? setEditing : undefined} empty="No suppliers yet." columns={[
            { key: 'name', label: 'Supplier', primary: true, render: (s) => <span className="min0"><span className="row-label">{s.name} {!s.active && <Pill tone="faint">Inactive</Pill>}</span><span className="row-sub">{[s.contact, s.phone, s.email].filter(Boolean).join(' · ')}</span></span> },
            { key: 'terms', label: 'Terms', render: (s) => s.terms || '—' },
            { key: 'item_count', label: 'Items', align: 'right' },
            { key: 'last_delivery', label: 'Last delivery', render: (s) => (s.last_delivery ? fmtDate(s.last_delivery) : '—') },
          ]} />
        </Card>
      )}
      {editing && <SupplierForm s={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function SupplierForm({ s, onClose, onSaved }) {
  const { toast } = useApp();
  const [f, setF] = useState({ name: s.name || '', contact: s.contact || '', phone: s.phone || '', email: s.email || '', trn: s.trn || '', terms: s.terms || '', leadDays: s.lead_days ?? '', notes: s.notes || '', active: s.id ? !!s.active : true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true); setErr(null);
    try { if (s.id) await put(`/api/suppliers/${s.id}`, f); else await post('/api/suppliers', f); toast('Supplier saved'); onSaved(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={s.id ? s.name : 'New supplier'} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
      <div className="form two">
        <Field label="Name" className="span2"><input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Contact person"><input value={f.contact} onChange={(e) => set('contact', e.target.value)} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" /></Field>
        <Field label="Email"><input value={f.email} onChange={(e) => set('email', e.target.value)} inputMode="email" /></Field>
        <Field label="TRN" hint="UAE VAT registration number, printed on the purchase order."><input value={f.trn} onChange={(e) => set('trn', e.target.value)} /></Field>
        <Field label="Payment terms"><input value={f.terms} onChange={(e) => set('terms', e.target.value)} placeholder="30 days, cash on delivery…" /></Field>
        <Field label="Usual delivery time (days)"><input type="number" min="0" value={f.leadDays} onChange={(e) => set('leadDays', e.target.value)} /></Field>
        <Field label="Notes" className="span2"><textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        {s.id && <div className="span2"><Check checked={!f.active} onChange={(v) => set('active', !v)}>No longer used</Check></div>}
      </div>
      <ErrorNote error={err} />
    </Sheet>
  );
}

