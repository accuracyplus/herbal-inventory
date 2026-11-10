/**
 * Requests: ask the store for stock; managers approve; the store gives it out.
 */

import { useEffect, useMemo, useState } from 'react';
import { fmtDateTime, fmtQty, get, post } from '../api.js';
import Icon from '../icons.jsx';
import LineEditor, { newLine, toPayload } from '../lines.jsx';
import {
  Button, Card, ErrorNote, Field, Loading, Page, Pill, QtyInput, Quiet, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';

export default function Requests() {
  const { route, navigate, can, stock } = useApp();
  const [status, setStatus] = useState(route.query.get('status') || 'OPEN');
  const { data, error, loading, reload } = useData(`/api/requests${status ? `?status=${status}` : ''}`, [status]);
  const [creating, setCreating] = useState(!!route.query.get('new'));
  const preItem = route.query.get('new');
  const manager = can('request.decide') || can('request.fulfil');

  return (
    <Page title="Requests" subtitle={manager ? 'Asked for, approved, and given out.' : 'What you have asked the store for.'}
      actions={can('request.create') && <Button icon="plus" onClick={() => setCreating(true)}>New request</Button>}>
      <Segmented label="Show" value={status} onChange={setStatus} options={[
        { value: 'OPEN', label: 'Open' }, { value: 'PENDING', label: 'To approve' }, { value: 'APPROVED', label: 'To give out' },
        { value: 'ISSUED', label: 'Done' }, { value: '', label: 'All' },
      ]} />
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} onRow={(r) => navigate(`requests/${r.id}`)} empty={status === 'OPEN' ? 'No open requests.' : 'Nothing here.'} columns={[
            { key: 'ref', label: 'Request', primary: true, render: (r) => (
              <span className="min0"><span className="row-label">{r.ref} {r.urgency === 'URGENT' && <Pill tone="danger">Urgent</Pill>}</span>
                <span className="row-sub">{r.summary}</span></span>
            ) },
            { key: 'to', label: 'For', render: (r) => r.to_name || r.area_name },
            { key: 'requested_by_name', label: 'Asked by', render: (r) => <span>{r.requested_by_name}<span className="row-sub">{fmtDateTime(r.requested_at)}</span></span> },
            { key: 'status', label: 'Status', render: (r) => <Pill status={r.status} /> },
          ]} />
        </Card>
      )}
      {creating && stock && <NewRequest preItem={preItem} onClose={() => { setCreating(false); if (preItem) navigate('requests'); }} onDone={(r) => { setCreating(false); reload(); navigate(`requests/${r.id}`); }} />}
      {route.id && <RequestSheet id={route.id} onClose={() => navigate('requests')} onChanged={reload} />}
    </Page>
  );
}

function NewRequest({ preItem, onClose, onDone }) {
  const { stock, lists, me, toast, refreshBadges } = useApp();
  const main = lists.stores.find((s) => s.kind === 'MAIN');
  const [fromId, setFromId] = useState(main?.id || lists.stores[0]?.id || '');
  const myStores = lists.stores.filter((s) => s.mine && s.id !== fromId);
  const [dest, setDest] = useState(myStores[0] ? `s:${myStores[0].id}` : '');
  const [urgency, setUrgency] = useState('NORMAL');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState(() => {
    const it = preItem && stock.items.find((i) => i.id === preItem);
    return it ? [newLine(it)] : [];
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [suggestTried, setSuggestTried] = useState(false);

  // For a sub store, offer to fill the request from its levels: what it needs to reach par.
  const toStore = dest.startsWith('s:') ? dest.slice(2) : null;
  const fill = async () => {
    setSuggestTried(true);
    try {
      const rows = await get(`/api/pos/suggestions?store=${toStore}`);
      const add = rows.map((r) => stock.items.find((i) => i.id === r.item_id) && newLine(stock.items.find((i) => i.id === r.item_id), { qty: String(r.suggest) })).filter(Boolean);
      setLines((cur) => [...cur, ...add.filter((a) => !cur.some((c) => c.item.id === a.item.id))]);
    } catch (e) { setErr(e); }
  };
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/requests', {
        fromStoreId: fromId, toStoreId: toStore, areaId: dest.startsWith('a:') ? dest.slice(2) : null,
        urgency, note, lines: toPayload(lines),
      });
      toast(r.status === 'APPROVED' ? `${r.ref} sent to the store` : `${r.ref} sent for approval`);
      refreshBadges();
      onDone(r);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const destOptions = [
    ...lists.stores.filter((s) => s.id !== fromId).map((s) => ({ value: `s:${s.id}`, label: `Store: ${s.name}` })),
    ...lists.areas.map((a) => ({ value: `a:${a.id}`, label: `Room: ${a.name}` })),
  ];
  return (
    <Sheet wide title="New request" onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} disabled={!lines.length || !dest || lines.some((l) => !(Number(l.qty) > 0))} onClick={save}>Send request</Button></>}>
      <div className="form two">
        <Field label="Ask"><Select value={fromId} onChange={setFromId} options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Needed in"><Select value={dest} onChange={setDest} placeholder="Choose" options={destOptions} /></Field>
        <Field label="How soon"><Select value={urgency} onChange={setUrgency} options={[{ value: 'NORMAL', label: 'Normal' }, { value: 'URGENT', label: 'Urgent — needed today' }]} /></Field>
        <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" maxLength={500} /></Field>
      </div>
      {me.settings['requests.approval'] === 'none' && <div className="note"><Icon name="check" size={18} />In {me.unit.name} requests go straight to the store — no approval step.</div>}
      {toStore && !suggestTried && <div><Button kind="ghost" icon="sparkle" onClick={fill}>Fill from this store's levels</Button></div>}
      <LineEditor mode="request" items={stock.items} storeId={fromId} lines={lines} setLines={setLines} />
      <ErrorNote error={err} />
    </Sheet>
  );
}

function RequestSheet({ id, onClose, onChanged }) {
  const { me, can, toast, refreshStock, refreshBadges } = useApp();
  const { data: r, error, loading, reload } = useData(`/api/requests/${id}`);
  const [qty, setQty] = useState({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!r) return;
    const q = {};
    for (const l of r.lines) {
      q[l.id] = r.status === 'PENDING' ? String(l.qty) : String(Math.max(0, Math.min((l.approved_qty ?? 0) - l.issued_qty, l.available)));
    }
    setQty(q);
  }, [r]);
  const act = async (path, body, msg) => {
    setBusy(true); setErr(null);
    try { await post(`/api/requests/${id}/${path}`, body); toast(msg); reload(); onChanged(); refreshBadges(); if (path === 'issue') refreshStock(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const mine = r && r.requested_by === me.staffId;
  const canDecide = r && r.status === 'PENDING' && can('request.decide');
  const canIssue = r && ['APPROVED', 'PARTLY_ISSUED'].includes(r.status) && can('request.fulfil');
  const canCancel = r && ['PENDING', 'APPROVED'].includes(r.status) && !r.lines.some((l) => l.issued_qty > 0) && (mine || can('request.decide'));
  const lineCols = useMemo(() => [
    { key: 'name', label: 'Item', primary: true, render: (l) => <span className="min0"><span className="row-label">{l.name}</span><span className="row-sub"><code>{l.code}</code> · {fmtQty(l.available)} {l.uom} in {r?.from_name}</span></span> },
    { key: 'qty', label: 'Asked', align: 'right', render: (l) => fmtQty(l.qty) },
    { key: 'approved_qty', label: 'Approved', align: 'right', render: (l) => (canDecide
      ? <QtyInput value={qty[l.id]} onChange={(v) => setQty((x) => ({ ...x, [l.id]: v }))} style={{ width: 96 }} label={`Approve ${l.name}`} />
      : fmtQty(l.approved_qty)) },
    { key: 'issued_qty', label: 'Given', align: 'right', render: (l) => (canIssue && (l.approved_qty ?? 0) > l.issued_qty
      ? <span style={{ display: 'grid', justifyItems: 'end', gap: 2 }}><QtyInput value={qty[l.id]} onChange={(v) => setQty((x) => ({ ...x, [l.id]: v }))} style={{ width: 96 }} label={`Give ${l.name}`} /><span className="row-sub">{fmtQty(l.issued_qty)} given so far</span></span>
      : fmtQty(l.issued_qty)) },
  ], [r, qty, canDecide, canIssue]);
  return (
    <Sheet wide title={r ? r.ref : 'Request'} onClose={onClose}
      footer={r && <>
        {canCancel && <Button kind="ghost" busy={busy} onClick={() => act('cancel', { note }, 'Request cancelled')}>Cancel request</Button>}
        {canDecide && !mine && <Button kind="secondary" busy={busy} onClick={() => act('decide', { action: 'REJECT', note }, 'Request rejected')}>Reject</Button>}
        {canDecide && <Button busy={busy} onClick={() => act('decide', { action: 'APPROVE', note, lines: r.lines.map((l) => ({ lineId: l.id, approvedQty: Number(qty[l.id] || 0) })) }, 'Request approved')}>Approve</Button>}
        {canIssue && <Button kind="secondary" busy={busy} onClick={() => act('issue', { close: true, lines: [] }, 'Request closed')}>Close as done</Button>}
        {canIssue && <Button icon="transfer" busy={busy} onClick={() => act('issue', { note, lines: r.lines.map((l) => ({ lineId: l.id, qty: Number(qty[l.id] || 0) })) }, 'Given out')}>Give out</Button>}
      </>}>
      <ErrorNote error={error} />
      {loading && <Loading />}
      {r && (
        <>
          <div className="row"><Pill status={r.status} />{r.urgency === 'URGENT' && <Pill tone="danger">Urgent</Pill>}</div>
          <dl className="dl">
            <dt>Asked by</dt><dd>{r.requested_by_name}, {fmtDateTime(r.requested_at)}</dd>
            <dt>From</dt><dd>{r.from_name}</dd>
            <dt>For</dt><dd>{r.to_name ? `Store: ${r.to_name}` : `Room: ${r.area_name}`}</dd>
            {r.note && <><dt>Note</dt><dd>{r.note}</dd></>}
            {r.decided_at && <><dt>Decided</dt><dd>{r.decided_by_name || 'Automatically'}, {fmtDateTime(r.decided_at)}{r.decision_note ? ` — “${r.decision_note}”` : ''}</dd></>}
          </dl>
          <Card pad={false}><Table columns={lineCols} rows={r.lines} /></Card>
          {r.issues.length > 0 && (
            <Card title="Given out">
              <ul className="timeline">{r.issues.map((t) => <li key={t.ref}><span><b>{t.ref}</b> by {t.by_name}<span className="row-sub">{fmtDateTime(t.at)}</span></span></li>)}</ul>
            </Card>
          )}
          {(canDecide || canIssue || canCancel) && (
            <Field label={canDecide ? 'Note for the person who asked' : 'Note'} hint={canDecide ? 'Required when rejecting: they will see it on Today.' : undefined}>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Optional" />
            </Field>
          )}
          {canDecide && mine && <div className="note"><Icon name="alert" size={18} />You asked for this, so another manager approves it — unless you are the only one.</div>}
          {!canDecide && !canIssue && r.status === 'PENDING' && <Quiet icon="clock">Waiting for a manager.</Quiet>}
          <ErrorNote error={err} />
        </>
      )}
    </Sheet>
  );
}
