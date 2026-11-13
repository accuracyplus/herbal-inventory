/**
 * Stock counts: start one for a store, count on a phone (blind by default), submit, and a
 * manager reviews the variances before anything changes.
 */

import { useEffect, useMemo, useState } from 'react';
import { fmtDate, fmtDateTime, fmtMoney, fmtQty, post, put } from '../api.js';
import Icon from '../icons.jsx';
import { t, tn } from '../i18n.js';
import { isDesk, PairSheet, ScanSheet } from '../scan/ScanSheets.jsx';
import {
  Button, Card, Check, ErrorNote, Field, Loading, Note, Page, Pill, QtyInput, Quiet, SearchBox, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';

export default function Counts() {
  const { route, navigate, can, me } = useApp();
  const { data, error, loading, reload } = useData('/api/counts');
  const [starting, setStarting] = useState(false);
  const abc = me.settings?.['abc.on'] === 'on';
  const tab = abc && route.query.get('tab') === 'cycle' ? 'cycle' : 'counts';
  return (
    <Page title="Stock counts" subtitle="Count the shelf; a manager reviews the differences before stock changes."
      actions={can('count.run') && <Button icon="plus" onClick={() => setStarting(true)}>Start a count</Button>}>
      {abc && <Segmented label="Show" value={tab} onChange={(v) => navigate(v === 'cycle' ? 'counts?tab=cycle' : 'counts')} options={[{ value: 'counts', label: 'Counts' }, { value: 'cycle', label: 'Cycle counts due' }]} />}
      {tab === 'cycle' && <CycleCounts onStarted={(id) => { reload(); navigate(`counts/${id}`); }} />}
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {tab === 'counts' && data && (
        <Card pad={false}>
          <Table rows={data} onRow={(c) => navigate(`counts/${c.id}`)} empty="No counts yet. Start one for a store." columns={[
            { key: 'ref', label: 'Count', primary: true, render: (c) => <span className="min0"><span className="row-label">{c.ref}</span><span className="row-sub">{c.store_name}{c.category ? ` · ${c.category}` : ''}{c.blind ? ` · ${t('blind')}` : ''}</span></span> },
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

const GRADE_TONE = { A: 'danger', B: 'warn', C: 'plain' };

/** ABC cycle counts: what is due in a store, A items first, and a count of just those. */
function CycleCounts({ onStarted }) {
  const { lists, can, toast } = useApp();
  const mine = lists.stores.filter((s) => s.mine);
  const [storeId, setStoreId] = useState(mine[0]?.id || '');
  const [grade, setGrade] = useState('');
  const { data, error, loading, reload } = useData(storeId ? `/api/abc?store=${storeId}` : null, [storeId]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const due = (data?.rows || []).filter((r) => r.due && (!grade || r.grade === grade));
  const start = async () => {
    if (!due.length) { setErr(new Error('Nothing is due in what is shown.')); return; }
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/counts', { storeId, itemIds: due.map((x) => x.itemId), blind: true, note: `Cycle count${grade ? `, ${grade} items` : ''}` });
      toast(t('{ref} started, {n} items to count', { ref: r.ref, n: r.lines }));
      onStarted(r.id);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <>
      <Card title="Cycle counts" hint="Items are graded by the value used in the last 90 days: A, the few that are most of it, are counted most often. An item is due when it has not been counted in a store for its grade's number of days.">
        <div className="form two">
          <Field label="Store"><Select value={storeId} onChange={setStoreId} options={mine.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Grade"><Select value={grade} onChange={setGrade} placeholder="Every grade" options={['A', 'B', 'C'].map((g) => ({ value: g, label: data ? t('{g} items: counted every {n} days', { g, n: data.days[g] }) : t('{g} items', { g }) }))} /></Field>
        </div>
        {data && <p className="muted">{t('{a} A, {b} B and {c} C items here; {due} due for counting.', { a: data.grades.A, b: data.grades.B, c: data.grades.C, due: data.due })}</p>}
        <ErrorNote error={error || err} onRetry={error ? reload : undefined} />
        {can('count.run') && data && <div className="row" style={{ justifyContent: 'flex-end' }}><Button busy={busy} icon="counts" onClick={start}>{due.length ? t('Count the {n} due', { n: due.length }) : t('Nothing due')}</Button></div>}
      </Card>
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table caption="Due for a cycle count" rows={due} rowKey={(r) => r.itemId} empty="Nothing is due. Every item has been counted within its grade's days." columns={[
            { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code> · {r.category}</span></span> },
            { key: 'grade', label: 'Grade', render: (r) => <Pill tone={GRADE_TONE[r.grade]}>{r.grade}</Pill> },
            { key: 'lastCounted', label: 'Last counted', render: (r) => (r.lastCounted ? fmtDate(r.lastCounted) : t('Never')) },
            { key: 'lateDays', label: 'Late by', align: 'right', render: (r) => (r.lateDays ? tn(r.lateDays, '{n} day', '{n} days') : '') },
          ]} />
        </Card>
      )}
    </>
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
    try { const r = await post('/api/counts', { storeId, category: category || null, blind }); toast(t('{ref} started, {n} items to count', { ref: r.ref, n: r.lines })); onDone(r.id); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title="Start a count" onClose={onClose} footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={go}>Start</Button></>}>
      <Field label="Store"><Select value={storeId} onChange={setStoreId} options={mine.map((s) => ({ value: s.id, label: s.name }))} /></Field>
      <Field label="What to count" hint="A whole store, or one category at a time: a cycle count."><Select value={category} onChange={setCategory} placeholder="Everything in the store" options={cats.map((c) => ({ value: c, label: c }))} /></Field>
      <Check checked={blind} onChange={setBlind}>{t('Blind count')}<span className="muted">: {t('counters do not see what the system expects (recommended)')}</span></Check>
      <p className="muted">{t('Stock can still be used while the count is open: the difference is worked out against the moment the count started.')}</p>
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
    try { const r = await post(`/api/counts/${id}/${action}`, { note }); toast(r.clamped?.length ? t('{msg}. Limited to what is on the shelf for: {items}', { msg: t(msg), items: r.clamped.join(', ') }) : msg); reload(); onChanged(); refreshBadges(); if (action === 'approve') refreshStock(); } catch (e) { setErr(e); } finally { setBusy(false); }
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
        {open && can('count.run') && <Button busy={busy} onClick={() => (counted ? act('submit', 'Submitted for review') : toast('Count at least one item first'))}>Submit</Button>}
        {c.status === 'SUBMITTED' && can('count.decide') && <><Button kind="secondary" busy={busy} onClick={() => act('reopen', 'Sent back for recounting')}>Send back</Button><Button busy={busy} onClick={() => act('approve', 'Count approved and stock corrected')}>Approve</Button></>}
      </>}>
      <div className="row"><Pill status={c.status} /><span className="muted">{t('{n} of {of} counted', { n: counted, of: c.lines.length })}{c.category ? ` · ${c.category}` : ''}{c.blind && c.hidden ? ` · ${t('blind')}` : ''}</span></div>
      {c.status !== 'OPEN' && !c.hidden && can('cost.view') && <p>{t('Net difference at cost:')} <b>{fmtMoney(totalVar, currency)}</b></p>}
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
                <div className="line-sub">{l.location ? <><b>{t('Shelf {shelf}', { shelf: l.location })}</b> · </> : null}<code>{l.code}</code> · {l.category}{!c.hidden && l.expected !== null ? ` · ${t('system {qty} {uom}', { qty: fmtQty(l.expected), uom: t(l.uom) })}` : ''}{l.counted_by ? ` · ${l.counted_by}` : ''}</div>
              </div>
              <div style={{ width: 120 }}>
                {open && can('count.run')
                  ? <QtyInput value={v} onChange={(x) => { setVals((s) => ({ ...s, [l.item_id]: x })); setDirty(true); }} label={t('Counted {name}', { name: l.name })} placeholder={t('Count')} />
                  : <b>{l.counted === null ? <span className="faint">{t('not counted')}</span> : `${fmtQty(l.counted)} ${t(l.uom)}`}</b>}
              </div>
              {variance !== null && variance !== 0 && (
                <div className="line-warning" style={{ color: variance < 0 ? undefined : 'inherit' }}>
                  {variance > 0 ? '+' : ''}{fmtQty(variance)} {t(l.uom)}{can('cost.view') && l.value !== null ? ` · ${fmtMoney(l.value, currency)}` : ''}
                </div>
              )}
            </div>
          );
        })}
        {!lines.length && <Quiet>Every item is counted.</Quiet>}
      </div>
      {c.status === 'SUBMITTED' && can('count.decide') && mine && <Note icon="alert">You submitted this count, so another manager approves it, unless you are the only one.</Note>}
      {['OPEN', 'SUBMITTED'].includes(c.status) && <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={t('Optional')} /></Field>}
      {c.decided_at && <p className="muted">{t(c.status === 'APPROVED' ? 'Approved by {name}, {when}' : 'Closed by {name}, {when}', { name: c.decided_by_name, when: fmtDateTime(c.decided_at) })}{c.decision_note ? `: “${c.decision_note}”` : ''}</p>}
      <ErrorNote error={err} />
    </Sheet>
  );
}

