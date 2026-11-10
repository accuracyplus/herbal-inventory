/**
 * Corrections: damaged, expired, lost, found. Raised by the store; nothing changes until a
 * manager approves.
 */

import { useState } from 'react';
import { fmtDateTime, fmtMoney, fmtQty, post } from '../api.js';
import Icon from '../icons.jsx';
import LineEditor, { lineErrors, toPayload } from '../lines.jsx';
import { Button, Card, ErrorNote, Field, Loading, Page, Pill, Segmented, Select, Sheet, Table, useApp, useData } from '../ui.jsx';

export default function Corrections() {
  const { route, navigate, can, currency } = useApp();
  const [status, setStatus] = useState(route.query.get('status') || 'PENDING');
  const { data, error, loading, reload } = useData(`/api/adjustments${status ? `?status=${status}` : ''}`, [status]);
  const [raising, setRaising] = useState(false);
  return (
    <Page title="Corrections" subtitle="Write-offs and finds. Stock changes only once a manager approves."
      actions={can('adjust.raise') && <Button icon="plus" onClick={() => setRaising(true)}>New correction</Button>}>
      <Segmented label="Show" value={status} onChange={setStatus} options={[
        { value: 'PENDING', label: 'Waiting' }, { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' }, { value: '', label: 'All' },
      ]} />
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} onRow={(a) => navigate(`corrections/${a.id}`)} empty="Nothing here." columns={[
            { key: 'ref', label: 'Correction', primary: true, render: (a) => <span className="min0"><span className="row-label">{a.ref} · {a.reason_label}</span><span className="row-sub">{a.summary}</span></span> },
            { key: 'store_name', label: 'Store' },
            ...(can('cost.view') ? [{ key: 'value', label: 'Value', align: 'right', render: (a) => fmtMoney(a.value, currency) }] : []),
            { key: 'requested_by_name', label: 'Raised by', render: (a) => <span>{a.requested_by_name}<span className="row-sub">{fmtDateTime(a.requested_at)}</span></span> },
            { key: 'status', label: 'Status', render: (a) => <Pill status={a.status} /> },
          ]} />
        </Card>
      )}
      {raising && <Raise onClose={() => setRaising(false)} onDone={() => { setRaising(false); reload(); }} />}
      {route.id && <AdjSheet id={route.id} onClose={() => navigate('corrections')} onChanged={reload} />}
    </Page>
  );
}

function Raise({ onClose, onDone }) {
  const { stock, lists, me, toast, refreshBadges } = useApp();
  const mine = lists.stores.filter((s) => s.mine);
  const [storeId, setStoreId] = useState(mine[0]?.id || '');
  const [reason, setReason] = useState('DAMAGED');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const takesAway = !['FOUND', 'CORRECTION', 'OTHER'].includes(reason);
  // Lines are entered as positive numbers when the reason can only take away, and signed otherwise.
  const errors = lineErrors(lines, takesAway ? 'out' : 'adjust', storeId);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const payload = toPayload(lines).map((l) => ({ ...l, qty: takesAway ? -Math.abs(l.qty) : reason === 'FOUND' ? Math.abs(l.qty) : l.qty }));
      const r = await post('/api/adjustments', { storeId, reason, note, lines: payload });
      toast(`${r.ref} sent for approval`); refreshBadges(); onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet wide title="New correction" onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} disabled={!lines.length || Object.keys(errors).length > 0} onClick={save}>Send for approval</Button></>}>
      <div className="form two">
        <Field label="Store"><Select value={storeId} onChange={setStoreId} options={mine.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Reason"><Select value={reason} onChange={setReason} options={Object.entries(me.labels.reasons).map(([k, v]) => ({ value: k, label: v }))} /></Field>
        <Field label="What happened" className="span2" hint="The approver reads this. Required for lost, correction and other.">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. bottle dropped in room 3; seal broken on delivery" />
        </Field>
      </div>
      <div className="note"><Icon name={takesAway ? 'minus' : 'plus'} size={18} />{takesAway ? 'Enter how many to take away.' : reason === 'FOUND' ? 'Enter how many were found.' : 'Enter − to take away or + to add.'}</div>
      <LineEditor mode={takesAway || reason === 'FOUND' ? 'out' : 'adjust'} items={stock?.items || []} storeId={storeId} lines={lines} setLines={setLines}
        errors={takesAway ? errors : {}} pickerFilter={(i) => !i.isLinen} />
      <ErrorNote error={err} />
    </Sheet>
  );
}

function AdjSheet({ id, onClose, onChanged }) {
  const { me, can, toast, refreshStock, refreshBadges, currency } = useApp();
  const { data: a, error, loading, reload } = useData(`/api/adjustments/${id}`);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const act = async (action, msg) => {
    setBusy(true); setErr(null);
    try { await post(`/api/adjustments/${id}/decide`, { action, note }); toast(msg); reload(); onChanged(); refreshBadges(); if (action === 'APPROVE') refreshStock(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const mine = a && a.requested_by === me.staffId;
  const pending = a && a.status === 'PENDING';
  return (
    <Sheet wide title={a ? `${a.ref} · ${a.reason_label}` : 'Correction'} onClose={onClose}
      footer={a && pending && <>
        {mine && <Button kind="ghost" busy={busy} onClick={() => act('CANCEL', 'Withdrawn')}>Withdraw</Button>}
        {can('adjust.decide') && <><Button kind="secondary" busy={busy} onClick={() => act('REJECT', 'Rejected')}>Reject</Button><Button busy={busy} onClick={() => act('APPROVE', 'Approved — stock corrected')}>Approve</Button></>}
      </>}>
      <ErrorNote error={error} />
      {loading && <Loading />}
      {a && (
        <>
          <div className="row"><Pill status={a.status} />{can('cost.view') && <span className="muted">{fmtMoney(a.value, currency)}</span>}</div>
          <dl className="dl">
            <dt>Store</dt><dd>{a.store_name}</dd>
            <dt>Raised by</dt><dd>{a.requested_by_name}, {fmtDateTime(a.requested_at)}</dd>
            {a.note && <><dt>What happened</dt><dd>{a.note}</dd></>}
            {a.decided_at && <><dt>Decided</dt><dd>{a.decided_by_name || a.requested_by_name}, {fmtDateTime(a.decided_at)}{a.decision_note ? ` — “${a.decision_note}”` : ''}</dd></>}
          </dl>
          <Card pad={false}>
            <Table rows={a.lines} columns={[
              { key: 'name', label: 'Item', primary: true, render: (l) => <span className="min0"><span className="row-label">{l.name}</span><span className="row-sub"><code>{l.code}</code>{l.batch_no ? ` · lot ${l.batch_no}` : ''}</span></span> },
              { key: 'qty', label: 'Change', align: 'right', render: (l) => <b>{l.qty > 0 ? '+' : ''}{fmtQty(l.qty)} {l.uom}</b> },
              { key: 'on_hand', label: 'On shelf now', align: 'right', render: (l) => fmtQty(l.on_hand) },
              ...(can('cost.view') ? [{ key: 'v', label: 'Value', align: 'right', render: (l) => fmtMoney(l.qty * (l.avg_cost || 0), currency) }] : []),
            ]} />
          </Card>
          {pending && can('adjust.decide') && mine && <div className="note"><Icon name="alert" size={18} />You raised this, so another manager approves it — unless you are the only one.</div>}
          {pending && (can('adjust.decide') || mine) && <Field label="Note" hint="Required when rejecting."><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>}
          <ErrorNote error={err} />
        </>
      )}
    </Sheet>
  );
}
