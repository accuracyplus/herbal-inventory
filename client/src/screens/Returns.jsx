/**
 * Returns and inspection (feature 14): stock held for inspection, released or rejected; goods
 * sent back to a supplier against a delivery, and the credit note that should follow.
 *
 * Each tab shows only where the unit has its feature on (`quarantine.on`, `returns.on`).
 */

import { useEffect, useState } from 'react';
import { fmtDate, fmtDateTime, fmtMoney, fmtQty, get, post } from '../api.js';
import { t } from '../i18n.js';
import {
  Button, Card, ErrorNote, Field, Loading, Note, Page, Pill, QtyInput, Quiet, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';

const on = (me, k) => !!me.settings?.[k] && me.settings[k] !== 'off';

export default function Returns() {
  const { me, route, navigate } = useApp();
  const tabs = [
    ...(on(me, 'quarantine.on') ? [{ value: 'inspect', label: 'Held for inspection' }] : []),
    ...(on(me, 'returns.on') ? [{ value: 'returns', label: 'Returns to suppliers' }] : []),
  ];
  const asked = route.query.get('tab') || (route.query.get('status') ? 'returns' : null);
  const tab = tabs.find((x) => x.value === asked)?.value || tabs[0]?.value;
  return (
    <Page title="Returns and inspection" subtitle="Deliveries held until they are checked, and goods going back to suppliers.">
      {tabs.length > 1 && <Segmented label="Show" value={tab} onChange={(v) => navigate(`returns?tab=${v}`)} options={tabs} />}
      {tab === 'inspect' && <Inspection />}
      {tab === 'returns' && <ReturnList status={route.query.get('status') || ''} id={route.id} />}
    </Page>
  );
}

// ── Inspection ───────────────────────────────────────────────────────────────────────────

function Inspection() {
  const { can } = useApp();
  const [status, setStatus] = useState('HELD');
  const { data, error, loading, reload } = useData(`/api/inspections?status=${status}`, [status]);
  const [open, setOpen] = useState(null);
  return (
    <>
      <Segmented label="Show" value={status} onChange={setStatus} options={[{ value: 'HELD', label: 'Held now' }, { value: 'RELEASED', label: 'Released' }, { value: 'REJECTED', label: 'Rejected' }]} />
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.length && <Card><Quiet>{status === 'HELD' ? 'Nothing is held. Every delivery has been checked.' : 'Nothing here yet.'}</Quiet></Card>}
      {data?.length > 0 && (
        <Card pad={false}>
          <Table caption="Held for inspection" rows={data} onRow={status === 'HELD' && can('inspect') ? setOpen : undefined} columns={[
            { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub">{[r.batch_no && t('Lot {lot}', { lot: r.batch_no }), r.expiry && t('expires {date}', { date: fmtDate(r.expiry) }), r.store_name].filter(Boolean).join(' · ')}</span></span> },
            { key: 'qty', label: 'Quantity', align: 'right', render: (r) => `${fmtQty(r.qty)} ${t(r.uom)}` },
            { key: 'receipt_ref', label: 'Delivery', render: (r) => <span className="min0"><span>{r.receipt_ref}</span><span className="row-sub">{r.supplier_name || t('No supplier')}</span></span> },
            status === 'HELD'
              ? { key: 'held_at', label: 'Held since', render: (r) => fmtDateTime(r.held_at) }
              : { key: 'decided_at', label: 'Decided', render: (r) => <span className="min0"><span>{fmtDateTime(r.decided_at)}, {r.decided_by_name}</span>{(r.note || r.return_ref) && <span className="row-sub">{[r.note, r.return_ref && t('returned as {ref}', { ref: r.return_ref })].filter(Boolean).join('. ')}</span>}</span> },
          ]} />
        </Card>
      )}
      {status === 'HELD' && data?.length > 0 && !can('inspect') && <Quiet icon="info">A manager releases held stock, or rejects it.</Quiet>}
      {open && <InspectSheet row={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload(); }} />}
    </>
  );
}

function InspectSheet({ row, onClose, onDone }) {
  const { me, toast, refreshStock, refreshBadges } = useApp();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const act = async (action) => {
    setBusy(true); setErr(null);
    try {
      const r = await post(`/api/inspections/${row.id}/${action}`, { note });
      toast(action === 'release' ? t('{name} released to {store}', { name: row.name, store: row.store_name })
        : r.returnRef ? t('{name} rejected, going back as {ref}', { name: row.name, ref: r.returnRef }) : t('{name} rejected and written off', { name: row.name }));
      refreshStock(); refreshBadges(); onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={row.name} onClose={onClose}
      footer={<><Button kind="secondary" busy={busy} onClick={() => act('reject')}>Reject</Button><Button busy={busy} icon="check" onClick={() => act('release')}>Release to the shelf</Button></>}>
      <p className="muted">{fmtQty(row.qty)} {t(row.uom)}{row.batch_no ? `, ${t('lot {lot}', { lot: row.batch_no })}` : ''}{row.expiry ? `, ${t('expires {date}', { date: fmtDate(row.expiry) })}` : ''}, {t('from {ref}', { ref: row.receipt_ref })}{row.supplier_name ? ` (${row.supplier_name})` : ''}, {t('received by {name}', { name: row.received_by })}.</p>
      <Field label="What was checked, or what was wrong" hint={on(me, 'returns.on') ? 'Needed to reject it. Rejected stock goes back to the supplier, waiting for its credit note.' : 'Needed to reject it. Rejected stock is written off.'}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </Field>
      <ErrorNote error={err} />
    </Sheet>
  );
}

// ── Returns ──────────────────────────────────────────────────────────────────────────────

const RSTATUS = {
  PENDING: ['warn', 'To approve'], SENT: ['info', 'Waiting for credit'], CREDITED: ['ok', 'Credited'],
  CLOSED: ['plain', 'Closed, no credit'], REJECTED: ['plain', 'Not sent'], CANCELLED: ['plain', 'Cancelled'],
};

function ReturnList({ status, id }) {
  const { navigate, currency } = useApp();
  const { data, error, loading, reload } = useData(`/api/returns${status ? `?status=${status}` : ''}`, [status]);
  return (
    <>
      <Segmented label="Show" value={status} onChange={(v) => navigate(`returns?tab=returns${v ? `&status=${v}` : ''}`)} options={[
        { value: '', label: 'All' }, { value: 'PENDING', label: 'To approve' }, { value: 'SENT', label: 'Waiting for credit' },
      ]} />
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.length && <Card><Quiet>{t(status ? 'No returns here. A return is raised from a delivery: open it under Purchasing, Deliveries.' : 'No returns yet. A return is raised from a delivery: open it under Purchasing, Deliveries.')}</Quiet></Card>}
      {data?.length > 0 && (
        <Card pad={false}>
          <Table caption="Returns" rows={data} onRow={(r) => navigate(`returns/${r.id}?tab=returns${status ? `&status=${status}` : ''}`)} columns={[
            { key: 'ref', label: 'Return', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.ref}</span><span className="row-sub">{r.summary}</span></span> },
            { key: 'supplier_name', label: 'Supplier', render: (r) => <span className="min0"><span>{r.supplier_name || t('No supplier')}</span><span className="row-sub">{t('from {ref}', { ref: r.receipt_ref })}</span></span> },
            { key: 'reason', label: 'Why', render: (r) => t(r.reason_label) },
            { key: 'value', label: 'Credit due', align: 'right', render: (r) => fmtMoney(r.value, currency) },
            { key: 'status', label: 'Status', render: (r) => <Pill tone={RSTATUS[r.status][0]}>{RSTATUS[r.status][1]}</Pill> },
          ]} />
        </Card>
      )}
      {id && <ReturnSheet id={id} onClose={() => navigate(`returns?tab=returns${status ? `&status=${status}` : ''}`)} onChanged={reload} />}
    </>
  );
}

function ReturnSheet({ id, onClose, onChanged }) {
  const { me, can, currency, toast, refreshStock, refreshBadges } = useApp();
  const { data: r, error, loading, reload } = useData(`/api/returns/${id}`, [id]);
  const [note, setNote] = useState('');
  const [credit, setCredit] = useState({ creditNo: '', creditDate: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => { if (r) setCredit((c) => ({ ...c, amount: c.amount || String(r.value) })); }, [r]);
  const act = async (action, extra = {}) => {
    setBusy(true); setErr(null);
    try {
      await post(`/api/returns/${id}/${action}`, { note, ...extra });
      toast(t({ approve: '{ref} approved: the stock has left', reject: '{ref} not sent', cancel: '{ref} cancelled', credit: 'Credit note recorded on {ref}', close: '{ref} closed' }[action], { ref: r.ref }));
      refreshStock(); refreshBadges(); reload(); onChanged();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const mine = r && r.raised_by === me.staffId;
  const footer = r && (
    r.status === 'PENDING'
      ? <>{(mine || can('return.decide')) && <Button kind="secondary" busy={busy} onClick={() => act('cancel')}>Cancel it</Button>}
          {can('return.decide') && <><Button kind="secondary" busy={busy} onClick={() => act('reject')}>Do not send</Button><Button busy={busy} icon="check" onClick={() => act('approve')}>Approve: send it back</Button></>}</>
      : r.status === 'SENT'
        ? <>{can('return.decide') && <Button kind="secondary" busy={busy} onClick={() => act('close')}>Close without credit</Button>}
            {can('po.edit') && <Button busy={busy} icon="check" onClick={() => act('credit', credit)}>Record the credit note</Button>}</>
        : null
  );
  return (
    <Sheet wide title={r ? r.ref : 'Return'} onClose={onClose} footer={footer}>
      <ErrorNote error={error} />
      {loading && !r && <Loading />}
      {r && (
        <>
          <p className="muted">{t(r.reason_label)}{r.note ? `: ${r.note}` : ''}. {t('From {ref}, {store}, to {supplier}.', { ref: r.receipt_ref, store: r.store_name, supplier: r.supplier_name || t('no named supplier') })} {t('Raised by {name} on {when}.', { name: r.raised_by_name, when: fmtDateTime(r.raised_at) })}</p>
          <div><Pill tone={RSTATUS[r.status][0]}>{RSTATUS[r.status][1]}</Pill></div>
          <Card pad={false}>
            <Table caption="Going back" rows={r.lines} columns={[
              { key: 'name', label: 'Item', primary: true, render: (l) => <span className="min0"><span className="row-label">{l.name}</span>{(l.batch_no || l.from_hold) ? <span className="row-sub">{[l.batch_no && t('Lot {lot}', { lot: l.batch_no }), l.from_hold && t('rejected at inspection')].filter(Boolean).join(' · ')}</span> : null}</span> },
              { key: 'qty', label: 'Quantity', align: 'right', render: (l) => `${fmtQty(l.qty)} ${t(l.uom)}` },
              { key: 'unit_cost', label: 'Price paid', align: 'right', render: (l) => fmtMoney(l.unit_cost, currency) },
              { key: 'value', label: 'Credit due', align: 'right', render: (l) => fmtMoney(l.qty * l.unit_cost, currency) },
            ]} />
          </Card>
          {r.decided_by_name && <p className="muted">{t(r.status === 'REJECTED' ? 'Not sent by {name}, {when}' : 'Approved by {name}, {when}', { name: r.decided_by_name, when: fmtDateTime(r.decided_at) })}{r.decision_note ? `: ${r.decision_note}` : ''}.</p>}
          {r.status === 'CREDITED' && <Note tone="ok" icon="check">{t('Credit note {no} of {date}: {amount}', { no: r.credit_no, date: fmtDate(r.credit_date), amount: fmtMoney(r.credit_amount, currency) })}{Math.abs(r.credit_amount - r.value) > 0.005 ? `, ${t('{amount} short of what was due', { amount: fmtMoney(r.value - r.credit_amount, currency) })}` : ''}. {t('Recorded by {name}.', { name: r.credited_by_name })}</Note>}
          {r.status === 'SENT' && can('po.edit') && (
            <div className="form two">
              <Field label="Credit note number"><input value={credit.creditNo} onChange={(e) => setCredit({ ...credit, creditNo: e.target.value })} maxLength={60} /></Field>
              <Field label="Date on the credit note"><input type="date" value={credit.creditDate} onChange={(e) => setCredit({ ...credit, creditDate: e.target.value })} /></Field>
              <Field label={t('Amount credited ({currency})', { currency })} hint={t('{amount} was due.', { amount: fmtMoney(r.value, currency) })}><QtyInput value={credit.amount} onChange={(v) => setCredit({ ...credit, amount: v })} label="Amount credited" /></Field>
            </div>
          )}
          {(r.status === 'PENDING' || r.status === 'SENT') && can('return.decide') && (
            <Field label="Note" hint={r.status === 'PENDING' ? 'Needed if it is not being sent.' : 'Needed to close it without a credit note: replaced instead, refused by the supplier.'}>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </Field>
          )}
          <ErrorNote error={err} />
        </>
      )}
    </Sheet>
  );
}

/** Raise a return against a delivery that is on the shelf. Opened from the delivery's page. */
export function RaiseReturn({ receiptId, onClose, onDone }) {
  const { me, currency, toast, refreshBadges } = useApp();
  const { data, error, loading } = useData(`/api/returns/options/${receiptId}`, [receiptId]);
  const [qty, setQty] = useState({});
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const lines = (data?.lines || []).filter((l) => Number(qty[l.id]) > 0).map((l) => ({ receiptLineId: l.id, qty: Number(qty[l.id]) }));
  const missing = [...(!lines.length ? ['how many of something are going back'] : []), ...(!reason ? ['why'] : [])];
  const save = async () => {
    if (missing.length) { setTried(true); return; }
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/returns', { receiptId, reason, note, lines });
      toast(t('{ref} raised, {amount} to be credited. A manager approves it.', { ref: r.ref, amount: fmtMoney(r.value, currency) }));
      refreshBadges(); onDone(r);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet wide title={data ? t('Return goods from {ref}', { ref: data.receipt.ref }) : 'Return goods'} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} icon="returns" onClick={save}>Raise the return</Button></>}>
      <ErrorNote error={error} />
      {loading && <Loading />}
      {data && (
        <>
          <Card pad={false}>
            <Table caption="On this delivery" rows={data.lines} columns={[
              { key: 'name', label: 'Item', primary: true, render: (l) => <span className="min0"><span className="row-label">{l.name}</span><span className="row-sub">{[l.batch_no && t('Lot {lot}', { lot: l.batch_no }), t('{qty} {uom} received', { qty: fmtQty(l.qty), uom: t(l.uom) }), l.returned > 0 && t('{qty} already going back', { qty: fmtQty(l.returned) })].filter(Boolean).join(' · ')}</span></span> },
              { key: 'left', label: 'Going back', align: 'right', render: (l) => (l.left > 0
                ? <QtyInput value={qty[l.id] ?? ''} onChange={(v) => setQty((x) => ({ ...x, [l.id]: v }))} label={t('Going back: {name}', { name: l.name })} placeholder={t('Up to {n}', { n: fmtQty(l.left) })} />
                : t('All returned')) },
            ]} />
          </Card>
          <div className="form two">
            <Field label="Why"><Select value={reason} onChange={setReason} placeholder="Choose" options={Object.entries(me.labels.returnReasons || data.reasons).map(([value, label]) => ({ value, label }))} /></Field>
            <Field label="Note" hint="What is wrong with it, for the supplier and the approver."><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
          </div>
          {tried && missing.length > 0 && <Note tone="warn" icon="alert" role="alert">{t('Still needed: {what}.', { what: missing.map((m) => t(m)).join(', ') })}</Note>}
          <ErrorNote error={err} />
        </>
      )}
    </Sheet>
  );
}
