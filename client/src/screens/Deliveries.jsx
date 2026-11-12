/**
 * Deliveries: what has been recorded, what is waiting for approval, and each one's page with its paperwork.
 * The approver sees the differences first: counted against the note, the note against the order.
 */

import { useState } from 'react';
import { fmtDate, fmtDateTime, fmtMoney, fmtQty, openFile, post, sendForm, shrinkImage } from '../api.js';
import { KeyValues, Timeline } from '@hifive/ui';
import { Button, Card, ErrorNote, Field, Loading, Note, Page, Pill, Quiet, Segmented, Table, useApp, useData } from '../ui.jsx';
import { Paperwork } from './Receive.jsx';

const STATUS = { PENDING: ['warn', 'Waiting approval'], APPROVED: ['ok', 'On the shelf'], REJECTED: ['danger', 'Sent back'], CANCELLED: ['faint', 'Cancelled'] };
export const DeliveryPill = ({ status }) => <Pill tone={STATUS[status]?.[0]}>{STATUS[status]?.[1] || status}</Pill>;

export function Deliveries({ initialStatus }) {
  const { navigate, currency, me } = useApp();
  const [status, setStatus] = useState(initialStatus ?? 'PENDING');
  const { data, error, loading, reload } = useData(`/api/receipts${status ? `?status=${status}` : ''}`, [status]);
  const needNote = me.settings['receipts.note'] !== 'optional';
  return (
    <>
      <Segmented label="Show" value={status} onChange={setStatus} options={[
        { value: 'PENDING', label: 'To approve' }, { value: 'APPROVED', label: 'On the shelf' }, { value: 'REJECTED', label: 'Sent back' }, { value: '', label: 'All' },
      ]} />
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} onRow={(r) => navigate(`purchasing/d/${r.id}`)} empty={status === 'PENDING' ? 'No deliveries waiting for approval.' : 'No deliveries here.'} columns={[
            { key: 'ref', label: 'Delivery', primary: true, render: (r) => (
              <span className="min0"><span className="row-label">{r.ref} {status === '' && <DeliveryPill status={r.status} />}
                {r.status === 'PENDING' && needNote && !r.notes && <Pill tone="warn">No note attached</Pill>}
                {r.differences > 0 && <Pill tone="warn">{r.differences} to check</Pill>}</span>
                <span className="row-sub">{[r.supplier_name || 'No supplier recorded', r.po_ref, r.note_no && `note ${r.note_no}`].filter(Boolean).join(' · ')}</span></span>
            ) },
            { key: 'store_name', label: 'Into' },
            { key: 'by_name', label: 'Received by', render: (r) => <span>{r.by_name}<span className="row-sub">{fmtDateTime(r.at)}</span></span> },
            { key: 'total', label: 'Total', align: 'right', render: (r) => fmtMoney(r.total, currency) },
          ]} />
        </Card>
      )}
    </>
  );
}

export function DeliveryPage({ id, onClose }) {
  const { me, can, toast, currency, refreshStock, refreshBadges } = useApp();
  const { data: r, error, loading, reload } = useData(`/api/receipts/${id}`);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const act = async (action, msg) => {
    setBusy(true); setErr(null);
    try { await post(`/api/receipts/${id}/${action}`, { note }); toast(msg); setNote(''); reload(); refreshBadges(); if (action === 'approve') refreshStock(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const attach = async () => {
    setBusy(true); setErr(null);
    const failed = [];
    for (const f of files) {
      try { await sendForm(`/api/receipts/${id}/files`, { kind: f.kind, file: await shrinkImage(f.file) }); } catch (e) { failed.push(`${f.file.name}: ${e.message}`); }
    }
    setFiles([]); setBusy(false); reload();
    if (failed.length) setErr(new Error(`Not attached: ${failed.join('; ')}`)); else toast('Attached');
  };
  const view = async (f) => { setErr(null); try { await openFile(f.id, f.name); } catch (e) { setErr(e); } };
  const remove = async (f) => { setErr(null); try { await post(`/api/files/${f.id}/remove`); toast('Removed'); reload(); } catch (e) { setErr(e); } };

  const pending = r?.status === 'PENDING';
  const mine = r && r.by_id === me.staffId;
  const decides = can('receipt.decide');
  const needNote = me.settings['receipts.note'] !== 'optional';
  const kinds = me.labels.fileKinds;
  const decided = r?.decided_at && r.decided_by_name
    ? { APPROVED: 'Approved', REJECTED: 'Sent back', CANCELLED: 'Cancelled' }[r.status] || 'Decided' : null;
  const sendBack = () => { if (!note.trim()) { setErr(new Error('Say why it is being sent back, in the note. The receiver sees it.')); return; } act('reject', 'Sent back to the receiver'); };
  return (
    <Page back={onClose} title={r ? `Delivery ${r.note_no || r.ref}` : 'Delivery'}
      subtitle={r ? `${r.supplier_name ? `From ${r.supplier_name}. ` : ''}Counted by ${r.by_name}, ${fmtDateTime(r.at)}.` : undefined}
      actions={r && pending && <>
        {(mine || decides) && <Button kind="ghost" busy={busy} onClick={() => act('cancel', 'Delivery cancelled')}>Cancel it</Button>}
        {decides && <Button kind="secondary" busy={busy} onClick={sendBack}>Send it back</Button>}
        {decides && <Button busy={busy} icon="check" onClick={() => act('approve', 'Approved. The stock is on the shelf.')}>Approve</Button>}
      </>}>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !r && <Loading />}
      {r && (
        <>
          <div className="row"><DeliveryPill status={r.status} /><span className="muted">{r.ref}</span></div>
          <ErrorNote error={err} />
          {r.flags.length > 0 && (
            <Note tone="warn" icon="alert" role="status">
              <b>{r.flags.length === 1 ? 'One thing to look at first.' : `${r.flags.length} things to look at first.`}</b>
              <ul className="inv-plain">{r.flags.map((f) => <li key={f.text}>{f.text}</li>)}</ul>
            </Note>
          )}
          {pending && decides && mine && <Note icon="info">You recorded this delivery, so another manager approves it, unless you are the only one.</Note>}

          <div className="grid2">
            <div className="stack" style={{ gap: 18 }}>
              <Card>
                <KeyValues columns={3} items={[
                  { label: 'Supplier', value: r.supplier_name },
                  { label: 'Note number', value: r.note_no },
                  { label: 'Date on the note', value: r.note_date && fmtDate(r.note_date) },
                  { label: 'Goes into', value: r.store_name },
                  { label: 'Against order', value: r.po_ref },
                  { label: 'Invoice', value: [r.invoice_no, r.invoice_date && fmtDate(r.invoice_date)].filter(Boolean).join(', ') },
                  { label: 'Value counted', value: fmtMoney(r.total, currency) },
                  { label: 'Note from the receiver', value: r.note },
                ]} />
                {r.flags.length === 0 && <Quiet>What was counted matches the note{r.po_ref ? ' and the order' : ''}.</Quiet>}
              </Card>

              <Card title="What arrived" pad={false}>
                <Table caption="What arrived" rows={r.lines} columns={[
                  { key: 'name', label: 'Item', primary: true, width: 'minmax(0, 2.2fr)', render: (l) => <span className="min0"><span className="row-label">{l.name}</span><span className="row-sub"><code>{l.code}</code>{l.note_text ? ` · on the note: “${l.note_text}”` : ''}{l.batch_no ? ` · lot ${l.batch_no}` : ''}{l.expiry ? ` · expires ${fmtDate(l.expiry)}` : ''}</span></span> },
                  { key: 'note_qty', label: 'On the note', align: 'right', render: (l) => `${fmtQty(l.note_qty === null ? l.qty : l.note_qty)} ${l.uom}` },
                  { key: 'qty', label: 'Counted', align: 'right', render: (l) => <b>{fmtQty(l.qty)} {l.uom}</b> },
                  ...(r.po_ref ? [{ key: 'po_qty', label: 'Still on order', align: 'right', render: (l) => (l.po_qty === null ? '' : fmtQty(l.po_qty)) }] : []),
                  { key: 'unit_cost', label: 'Unit cost', align: 'right', render: (l) => fmtMoney(l.unit_cost, currency) },
                  { key: 'line', label: 'Value', align: 'right', sort: (l) => l.qty * l.unit_cost, render: (l) => fmtMoney(l.qty * l.unit_cost, currency) },
                ]} />
                <p className="inv-total"><span className="muted">Total counted</span><span className="inv-number" style={{ fontSize: 18 }}>{fmtMoney(r.total, currency)}</span></p>
              </Card>
            </div>

            <div className="stack" style={{ gap: 18 }}>
              <Card title="Paperwork">
                {pending && needNote && !r.hasNote && <Note tone="warn" icon="alert">No delivery note is attached. It cannot be approved until one is.</Note>}
                {r.files.length > 0 && (
                  <ul className="lots">
                    {r.files.map((f) => (
                      <li key={f.id} className="lot">
                        <div className="min0"><span className="row-label">{kinds[f.kind] || f.kind}</span>
                          <span className="row-sub">{f.name} · {Math.max(1, Math.round(f.bytes / 1024))} KB · {f.uploaded_by_name}, {fmtDateTime(f.uploaded_at)}</span></div>
                        <div className="lot-actions">
                          <Button kind="secondary" onClick={() => view(f)}>View</Button>
                          {pending && (f.uploaded_by === me.staffId || decides) && can('receive') && <Button kind="ghost" onClick={() => remove(f)}>Remove</Button>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {!r.files.length && <Quiet icon="info">Nothing attached yet.</Quiet>}
                {can('receive') && ['PENDING', 'APPROVED'].includes(r.status) && me.has?.files !== false && (
                  <>
                    <Paperwork files={files} setFiles={setFiles} kinds={kinds} needNote={false} />
                    {files.length > 0 && <div className="inv-submit"><Button busy={busy} onClick={attach}>Attach {files.length} file{files.length === 1 ? '' : 's'}</Button></div>}
                  </>
                )}
              </Card>

              <Card title="What has happened">
                <Timeline label="What has happened to this delivery" items={[
                  ...(decided ? [{ key: 'decided', date: fmtDateTime(r.decided_at), title: decided, sub: `${r.decided_by_name}${r.decision_note ? `: “${r.decision_note}”` : ''}` }] : []),
                  { key: 'counted', date: fmtDateTime(r.at), title: 'Counted and recorded', sub: r.by_name },
                ]} />
              </Card>

              {pending && (decides || mine) && (
                <Field label="Note (optional)" hint="Needed when sending a delivery back: the receiver sees it.">
                  <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
                </Field>
              )}
              {pending && <Quiet icon="info">Nothing is on the shelf until this is approved.</Quiet>}
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
