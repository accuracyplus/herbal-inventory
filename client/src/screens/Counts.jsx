/**
 * Stock counts: start one for a store, count on a phone (blind by default), submit, and a
 * manager reviews the variances before anything changes.
 */

import { useEffect, useMemo, useState } from 'react';
import { fmtDateTime, fmtMoney, fmtQty, post, put } from '../api.js';
import Icon from '../icons.jsx';
import { isDesk, PairSheet, ScanSheet } from '../scan/ScanSheets.jsx';
import {
  Button, Card, Check, ErrorNote, Field, Loading, Note, Page, Pill, QtyInput, Quiet, SearchBox, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';

export default function Counts() {
  const { route, navigate, can } = useApp();
  const { data, error, loading, reload } = useData('/api/counts');
  const [starting, setStarting] = useState(false);
  return (
    <Page title="Stock counts" subtitle="Count the shelf; a manager reviews the differences before stock changes."
      actions={can('count.run') && <Button icon="plus" onClick={() => setStarting(true)}>Start a count</Button>}>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} onRow={(c) => navigate(`counts/${c.id}`)} empty="No counts yet. Start one for a store." columns={[
            { key: 'ref', label: 'Count', primary: true, render: (c) => <span className="min0"><span className="row-label">{c.ref}</span><span className="row-sub">{c.store_name}{c.category ? ` · ${c.category}` : ''}{c.blind ? ' · blind' : ''}</span></span> },
            { key: 'progress', label: 'Counted', align: 'right', render: (c) => `${c.counted_count} / ${c.line_count}` },
            { key: 'started_at', label: 'Started', render: (c) => <span>{c.started_by_name}<span className="row-sub">{fmtDateTime(c.started_at)}</span></span> },
            { key: 'status', label: 'Status', render: (c) => <Pill status={c.status === 'SUBMITTED' ? 'SUBMITTED' : c.status} /> },
          ]} />
        </Card>
      )}
      {starting && <StartCount onClose={() => setStarting(false)} onDone={(id) => { setStarting(false); reload(); navigate(`counts/${id}`); }} />}
      {route.id && <CountSheet id={route.id} onClose={() => navigate('counts')} onChanged={reload} />}
    </Page>
  );
}

function StartCount({ onClose, onDone }) {
  const { lists, stock, toast } = useApp();
  const mine = lists.stores.filter((s) => s.mine);
  const [storeId, setStoreId] = useState(mine[0]?.id || '');
  const [category, setCategory] = useState('');
  const [blind, setBlind] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const cats = [...new Set((stock?.items || []).map((i) => i.category))].sort();
  const go = async () => {
    setBusy(true); setErr(null);
    try { const r = await post('/api/counts', { storeId, category: category || null, blind }); toast(`${r.ref} started — ${r.lines} items to count`); onDone(r.id); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title="Start a count" onClose={onClose} footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={go}>Start</Button></>}>
      <Field label="Store"><Select value={storeId} onChange={setStoreId} options={mine.map((s) => ({ value: s.id, label: s.name }))} /></Field>
      <Field label="What to count" hint="A whole store, or one category at a time — a cycle count."><Select value={category} onChange={setCategory} placeholder="Everything in the store" options={cats.map((c) => ({ value: c, label: c }))} /></Field>
      <Check checked={blind} onChange={setBlind}>Blind count <span className="muted">— counters do not see what the system expects (recommended)</span></Check>
      <p className="muted">Stock can still be used while the count is open: the difference is worked out against the moment the count started.</p>
      <ErrorNote error={err} />
    </Sheet>
  );
}

function CountSheet({ id, onClose, onChanged }) {
  const { can, toast, refreshStock, refreshBadges, currency, me } = useApp();
  const { data: c, error, loading, reload } = useData(`/api/counts/${id}`);
  const [vals, setVals] = useState({});
  const [q, setQ] = useState('');
  const [onlyLeft, setOnlyLeft] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [scanning, setScanning] = useState(null);
  useEffect(() => { if (c) { setVals(Object.fromEntries(c.lines.map((l) => [l.item_id, l.counted ?? '']))); setDirty(false); } }, [c]);
  const lines = useMemo(() => (c ? c.lines.filter((l) => {
    if (q && !`${l.name} ${l.code} ${l.barcode || ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (onlyLeft && vals[l.item_id] !== '' && vals[l.item_id] !== null) return false;
    return true;
  }) : []), [c, q, onlyLeft, vals]);
  if (!c) return <Sheet title="Count" onClose={onClose}><ErrorNote error={error} />{loading && <Loading />}</Sheet>;

  const open = c.status === 'OPEN';
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await put(`/api/counts/${id}/lines`, { lines: c.lines.map((l) => ({ itemId: l.item_id, counted: vals[l.item_id] === '' ? null : vals[l.item_id] })) });
      toast('Saved'); setDirty(false); reload(); return true;
    } catch (e) { setErr(e); return false; } finally { setBusy(false); }
  };
  const act = async (action, msg) => {
    if (open && dirty && !(await save())) return;
    setBusy(true); setErr(null);
    try { const r = await post(`/api/counts/${id}/${action}`, { note }); toast(r.clamped?.length ? `${msg}. Limited to what is on the shelf for: ${r.clamped.join(', ')}` : msg); reload(); onChanged(); refreshBadges(); if (action === 'approve') refreshStock(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  /** A scan counts one more of an item on this count; anything else is not part of it. */
  const countOne = (item) => {
    if (!c.lines.some((l) => l.item_id === item.id)) return false;
    setVals((s) => ({ ...s, [item.id]: String((Number(s[item.id]) || 0) + 1) }));
    setDirty(true);
    return true;
  };
  const counted = Object.values(vals).filter((v) => v !== '' && v !== null).length;
  const totalVar = c.lines.reduce((s, l) => s + (l.value || 0), 0);
  const mine = c.submitted_by === me.staffId;

  return (
    <Sheet wide title={`${c.ref} · ${c.store_name}`} onClose={onClose}
      footer={<>
        {['OPEN', 'SUBMITTED'].includes(c.status) && (can('count.run') || can('count.decide')) && <Button kind="ghost" busy={busy} onClick={() => act('cancel', 'Count cancelled')}>Cancel count</Button>}
        {open && can('count.run') && <Button kind="secondary" busy={busy} disabled={!dirty} onClick={save}>Save progress</Button>}
        {open && can('count.run') && <Button busy={busy} disabled={!counted} onClick={() => act('submit', 'Submitted for review')}>Submit</Button>}
        {c.status === 'SUBMITTED' && can('count.decide') && <><Button kind="secondary" busy={busy} onClick={() => act('reopen', 'Sent back for recounting')}>Send back</Button><Button busy={busy} onClick={() => act('approve', 'Count approved and stock corrected')}>Approve</Button></>}
      </>}>
      <div className="row"><Pill status={c.status} /><span className="muted">{counted} of {c.lines.length} counted{c.category ? ` · ${c.category}` : ''}{c.blind && c.hidden ? ' · blind' : ''}</span></div>
      {c.status !== 'OPEN' && !c.hidden && can('cost.view') && <p>Net difference at cost: <b>{fmtMoney(totalVar, currency)}</b></p>}
      {open && (
        <div className="toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Find an item, or scan" />
          <Check checked={onlyLeft} onChange={setOnlyLeft}>Only those not counted</Check>
          {can('count.run') && <Button kind="secondary" icon="scan" onClick={() => setScanning('camera')}>Scan</Button>}
          {can('count.run') && isDesk() && <Button kind="secondary" icon="phone" onClick={() => setScanning('phone')}>Scan with phone</Button>}
        </div>
      )}
      {scanning === 'camera' && <ScanSheet onItem={countOne} onClose={() => setScanning(null)} />}
      {scanning === 'phone' && <PairSheet purpose="count" onItem={countOne} onClose={() => setScanning(null)} />}
      <div className="lines">
        {lines.map((l) => {
          const v = vals[l.item_id];
          const variance = !c.hidden && v !== '' && v !== null && l.expected !== null ? +(Number(v) - l.expected).toFixed(3) : null;
          return (
            <div key={l.item_id} className={`line ${variance ? (variance < 0 ? 'danger' : 'warn') : ''}`}>
              <div className="min0">
                <div className="line-name">{l.name}</div>
                <div className="line-sub"><code>{l.code}</code> · {l.category}{!c.hidden && l.expected !== null ? ` · system ${fmtQty(l.expected)} ${l.uom}` : ''}{l.counted_by ? ` · ${l.counted_by}` : ''}</div>
              </div>
              <div style={{ width: 120 }}>
                {open && can('count.run')
                  ? <QtyInput value={v} onChange={(x) => { setVals((s) => ({ ...s, [l.item_id]: x })); setDirty(true); }} label={`Counted ${l.name}`} placeholder="Count" />
                  : <b>{l.counted === null ? <span className="faint">not counted</span> : `${fmtQty(l.counted)} ${l.uom}`}</b>}
              </div>
              {variance !== null && variance !== 0 && (
                <div className="line-warning" style={{ color: variance < 0 ? undefined : 'inherit' }}>
                  {variance > 0 ? '+' : ''}{fmtQty(variance)} {l.uom}{can('cost.view') && l.value !== null ? ` · ${fmtMoney(l.value, currency)}` : ''}
                </div>
              )}
            </div>
          );
        })}
        {!lines.length && <Quiet>Every item is counted.</Quiet>}
      </div>
      {c.status === 'SUBMITTED' && can('count.decide') && mine && <Note icon="alert">You submitted this count, so another manager approves it — unless you are the only one.</Note>}
      {['OPEN', 'SUBMITTED'].includes(c.status) && <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Optional" /></Field>}
      {c.decided_at && <p className="muted">{c.status === 'APPROVED' ? 'Approved' : 'Closed'} by {c.decided_by_name}, {fmtDateTime(c.decided_at)}{c.decision_note ? ` — “${c.decision_note}”` : ''}</p>}
      <ErrorNote error={err} />
    </Sheet>
  );
}

