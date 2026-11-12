/**
 * Purchasing: what to buy, purchase orders from draft to delivery, and suppliers.
 */

import { useEffect, useState } from 'react';
import { fmtDate, fmtDateTime, fmtMoney, fmtQty, openPath, post, put } from '../api.js';
import LineEditor, { newLine, toPayload } from '../lines.jsx';
import {
  Button, Card, ErrorNote, Field, Loading, Note, Page, Pill, Quiet, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';
import { Deliveries, DeliveryPage, DeliveryPill } from './Deliveries.jsx';
import { priceViewer, SupplierList, SupplierPage } from './Suppliers.jsx';
import Levels, { MissingLevels } from './Levels.jsx';

export default function Purchasing() {
  const { route, navigate, can } = useApp();
  const [tab, setTab] = useState(route.query.get('tab') || (route.id === 'd' ? 'deliveries' : route.id === 's' ? 'suppliers' : 'orders'));
  const [status, setStatus] = useState(route.query.get('status') || 'OPEN');
  const [editing, setEditing] = useState(null);
  const [levelsStart, setLevelsStart] = useState('');
  const { data, error, loading, reload } = useData(tab === 'orders' ? `/api/pos${status ? `?status=${status}` : ''}` : null, [status, tab]);

  // A delivery is a page of its own, not a window over the list.
  if (route.id === 'd' && route.sub) return <DeliveryPage id={route.sub} onClose={() => navigate('purchasing?tab=deliveries')} />;
  if (route.id === 's' && route.sub) return <SupplierPage id={route.sub} onClose={() => navigate('purchasing?tab=suppliers')} />;

  return (
    <Page title="Purchasing" subtitle="Reorder suggestions, purchase orders and suppliers."
      actions={can('po.edit') && tab === 'orders' && <Button icon="plus" onClick={() => setEditing({})}>New order</Button>}>
      <Segmented label="Section" value={tab} onChange={setTab} options={[
        { value: 'orders', label: 'Orders' }, { value: 'deliveries', label: 'Deliveries' },
        ...(can('po.edit') ? [{ value: 'suggest', label: 'What to buy' }] : []),
        ...(can('po.edit') || can('items.edit') ? [{ value: 'levels', label: 'Suggested levels' }] : []), { value: 'suppliers', label: 'Suppliers' },
      ]} />
      {tab === 'deliveries' && <Deliveries initialStatus={route.query.get('tab') === 'deliveries' ? route.query.get('status') : undefined} />}
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
                { key: 'expected_date', label: 'Expected', render: (p) => (p.expected_date ? fmtDate(p.expected_date) : '') },
                { key: 'total', label: 'Total', align: 'right', render: (p) => fmtMoney(p.total) },
                { key: 'status', label: 'Status', render: (p) => <Pill status={p.status} /> },
              ]} />
            </Card>
          )}
        </>
      )}
      {tab === 'suggest' && <Suggestions onDraft={(prefill) => { setEditing(prefill); setTab('orders'); }} onLevels={(storeId) => { setLevelsStart(storeId); setTab('levels'); }} />}
      {tab === 'levels' && <Levels key={levelsStart} start={levelsStart} />}
      {tab === 'suppliers' && <SupplierList />}
      {route.id && !['d', 's'].includes(route.id) && <PoSheet id={route.id} onClose={() => navigate('purchasing')} onChanged={reload} onEdit={(po) => setEditing(po)} />}
      {editing && <PoEditor po={editing} onClose={() => setEditing(null)} onSaved={(id) => { setEditing(null); reload(); navigate(`purchasing/${id}`); }} />}
    </Page>
  );
}

function Suggestions({ onDraft, onLevels }) {
  const { lists, stock, currency } = useApp();
  const mains = lists.stores.filter((s) => s.kind === 'MAIN');
  const [chosen, setStoreId] = useState('');
  const storeId = chosen || mains[0]?.id || lists.stores[0]?.id || '';
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
      <MissingLevels storeId={storeId} onOpen={onLevels} />
      <ErrorNote error={error} />
      {loading && <Loading />}
      {data && !data.length && <Card><Quiet>Nothing needs ordering for this store.</Quiet></Card>}
      {Object.entries(bySupplier).map(([sid, g]) => (
        <Card key={sid} title={g.name} actions={stock && <Button icon="purchasing" onClick={() => onDraft({
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
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);
  const [guide, setGuide] = useState({});
  const ids = lines.map((l) => l.item.id).join(',');
  useEffect(() => {
    if (!supplierId || !ids) { setGuide({}); return undefined; }
    let live = true;
    post('/api/prices/guide', { supplierId, itemIds: ids.split(',') }).then((g) => { if (live) setGuide(g); }).catch(() => { if (live) setGuide({}); });
    return () => { live = false; };
  }, [supplierId, ids]);
  if (!stock) return null;
  const notes = {};
  for (const l of lines) {
    const g = guide[l.item.id];
    if (!g) continue;
    const words = [];
    if (g.here) words.push(`Last paid to this supplier: ${fmtMoney(g.here.price, currency)} on ${fmtDate(g.here.day)}.`);
    if (g.best) words.push(`${g.best.supplierName} charged ${fmtMoney(g.best.price, currency)} on ${fmtDate(g.best.day)}.`);
    if (words.length) notes[l.item.id] = words.join(' ');
  }
  const missing = [...(!supplierId ? ['the supplier'] : []), ...(!lines.length ? ['at least one item'] : [])];
  const save = async () => {
    if (missing.length) { setTried(true); return; }
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
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>Save draft</Button></>}>
      <div className="form two">
        <Field label="Supplier"><Select value={supplierId} onChange={setSupplierId} placeholder="Choose" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Deliver to"><Select value={storeId} onChange={setStoreId} options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Expected by (optional)" hint="The date it should all have arrived. The supplier's record is judged against it."><input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
        <Field label="Note to the supplier (optional)" hint="Printed on the order."><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
      </div>
      {suppliers && !suppliers.length && <Note tone="warn" icon="alert">Add a supplier first, on the Suppliers tab.</Note>}
      <LineEditor mode="po" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} showCost currency={currency} notes={notes} />
      {tried && missing.length > 0 && <Note tone="warn" icon="alert" role="alert">Still needed: {missing.join(', ')}.</Note>}
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
  const seesPrices = priceViewer(can);
  // Worth a second look before approving: a price above what this supplier was paid last time,
  // or another supplier who charged less.
  const dearer = po && seesPrices ? po.lines.filter((l) => l.last_cost !== null && l.last_cost !== undefined && l.unit_cost > l.last_cost) : [];
  const cheaper = po && seesPrices ? po.lines.filter((l) => l.best && l.best.price < l.unit_cost) : [];
  const sendable = po && ['APPROVED', 'PARTLY_RECEIVED'].includes(po.status) && can('po.send');
  return (
    <Sheet wide title={po ? `${po.ref} · ${po.supplier_name}` : 'Purchase order'} onClose={onClose}
      footer={po && <>
        <Button kind="ghost" icon="file" onClick={() => openPath(`/api/pos/${po.id}/pdf`, `${po.ref}.pdf`).catch(setErr)}>PDF</Button>
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
              ...(seesPrices ? [{ key: 'last_cost', label: 'Last paid', align: 'right', render: (l) => (l.last_cost === null || l.last_cost === undefined ? '' : fmtMoney(l.last_cost, currency)) }] : []),
              { key: 'line', label: 'Line total', align: 'right', render: (l) => fmtMoney(l.qty * l.unit_cost, currency) },
              { key: 'received_qty', label: 'Received', align: 'right', render: (l) => fmtQty(l.received_qty) },
            ]} />
          </Card>
          {po.receipts.length > 0 && (
            <Card title="Deliveries">
              <ul className="timeline">{po.receipts.map((r) => <li key={r.id}><span><button className="link" onClick={() => navigate(`purchasing/d/${r.id}`)}><b>{r.ref}</b></button> · {fmtMoney(r.total, currency)}{r.invoice_no ? ` · invoice ${r.invoice_no}` : ''} {r.status === 'PENDING' && <DeliveryPill status={r.status} />}<span className="row-sub">{r.by_name}, {fmtDateTime(r.at)}</span></span></li>)}</ul>
            </Card>
          )}
          {['DRAFT', 'SUBMITTED'].includes(po.status) && (dearer.length > 0 || cheaper.length > 0) && (
            <Note tone="warn" icon="alert">
              <b>Prices to look at.</b>
              <ul className="inv-plain">
                {dearer.map((l) => <li key={`d${l.id}`}>{l.name}: {fmtMoney(l.unit_cost, currency)} here, {fmtMoney(l.last_cost, currency)} last time on {fmtDate(l.last_day)}.</li>)}
                {cheaper.map((l) => <li key={`c${l.id}`}>{l.name}: {l.best.supplierName} charged {fmtMoney(l.best.price, currency)} on {fmtDate(l.best.day)}.</li>)}
              </ul>
            </Note>
          )}
          {sendable && <SendToSupplier po={po} onSent={reload} />}
          {po.emails.length > 0 && (
            <Card title="Sent to the supplier">
              <ul className="timeline">{po.emails.map((e) => <li key={e.at}><span><b>{e.status === 'SENT' ? `Emailed to ${e.to_email}` : `Not sent to ${e.to_email}`}</b>{e.cc ? `, copy to ${e.cc}` : ''}<span className="row-sub">{e.by_name}, {fmtDateTime(e.at)}{e.error ? `. ${e.error}` : ''}</span></span></li>)}</ul>
            </Card>
          )}
          {po.status === 'SUBMITTED' && can('po.decide') && mine && <Note icon="alert">You raised this order, so another manager approves it — unless you are the only one.</Note>}
          {(['SUBMITTED', 'PARTLY_RECEIVED'].includes(po.status) || ['DRAFT', 'APPROVED'].includes(po.status)) && (
            <Field label="Note" hint="Required when sending back or closing short."><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
          )}
          <ErrorNote error={err} />
        </>
      )}
    </Sheet>
  );
}

/**
 * Email an approved order to its supplier, with its PDF. Part of the order's own window, not a
 * window of its own (Design Guide: no window over another). Sending again has to be asked for.
 */
function SendToSupplier({ po, onSent }) {
  const { me, toast } = useApp();
  const [cc, setCc] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const sent = po.emails.find((e) => e.status === 'SENT');
  const send = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await post(`/api/pos/${po.id}/email`, { cc, message, again: !!sent });
      toast(`Emailed to ${r.to}`); setCc(''); setMessage(''); onSent();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (!me.has?.mail) {
    return <Quiet icon="info">Emailing is not set up for this app yet. Download the PDF and send it yourself.</Quiet>;
  }
  if (!po.supplier_email) {
    return <Note icon="info">{po.supplier_name} has no email address. Add it under Purchasing, Suppliers, to send the order from here.</Note>;
  }
  return (
    <Card title={sent ? 'Send it again' : 'Send it to the supplier'} hint="The order goes as a PDF, from this unit's mailbox. Nothing is sent until you press the button.">
      <p className="muted">To {po.supplier_email}{po.supplier_contact ? `, for ${po.supplier_contact}` : ''}.</p>
      <div className="form two">
        <Field label="Copy to (optional)" hint="Up to five addresses, separated by commas."><input value={cc} onChange={(e) => setCc(e.target.value)} inputMode="email" maxLength={600} /></Field>
        <Field label="A line for the supplier (optional)"><input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} /></Field>
      </div>
      <ErrorNote error={err} />
      <div className="inv-submit"><Button busy={busy} icon="check" onClick={send}>{sent ? 'Send again' : 'Email the order'}</Button></div>
    </Card>
  );
}
