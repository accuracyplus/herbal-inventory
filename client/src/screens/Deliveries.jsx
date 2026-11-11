/**
 * Deliveries: what has been recorded, what is waiting for approval, and each one's paperwork.
 * The approver sees the differences first: counted against the note, the note against the order.
 */

import { useState } from 'react';
import { fmtDate, fmtDateTime, fmtMoney, fmtQty, openFile, post, sendForm, shrinkImage } from '../api.js';
import Icon from '../icons.jsx';
import { Button, Card, ErrorNote, Field, Loading, Pill, Quiet, Segmented, Sheet, Table, useApp, useData } from '../ui.jsx';
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

export function ReceiptSheet({ id, onClose }) {
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
    if (failed.length) setErr(new Error(`Not attached — ${failed.join('; ')}`)); else toast('Attached');
  };
  const view = async (f) => { setErr(null); try { await openFile(f.id, f.name); } catch (e) { setErr(e); } };
  const remove = async (f) => { setErr(null); try { await post(`/api/files/${f.id}/remove`); toast('Removed'); reload(); } catch (e) { setErr(e); } };

  const pending = r?.status === 'PENDING';
  const mine = r && r.by_id === me.staffId;
  const decides = can('receipt.decide');
  const needNote = me.settings['receipts.note'] !== 'optional';
  const kinds = me.labels.fileKinds;
  return (
    <Sheet wide title={r ? `${r.ref}${r.supplier_name ? ` · ${r.supplier_name}` : ''}` : 'Delivery'} onClose={onClose}
      footer={r && pending && <>
        {(mine || decides) && <Button kind="ghost" busy={busy} onClick={() => act('cancel', 'Delivery cancelled')}>Cancel delivery</Button>}
        {decides && <Button kind="secondary" busy={busy} onClick={() => act('reject', 'Sent back to the receiver')}>Send back</Button>}
        {decides && <Button busy={busy} icon="check" onClick={() => act('approve', 'Approved — the stock is on the shelf')}>Approve</Button>}
      </>}>
      <ErrorNote error={error} />
      {loading && !r && <Loading />}
      {r && (
        <>
          <div className="row"><DeliveryPill status={r.status} /><span className="muted">{fmtMoney(r.total, currency)} · {r.lines.length} line{r.lines.length === 1 ? '' : 's'}</span></div>
          <dl className="dl">
            <dt>Into</dt><dd>{r.store_name}</dd>
            {r.po_ref && <><dt>Against</dt><dd>{r.po_ref}</dd></>}
            {(r.note_no || r.note_date) && <><dt>Delivery note</dt><dd>{[r.note_no, r.note_date && fmtDate(r.note_date)].filter(Boolean).join(' · ')}</dd></>}
            {(r.invoice_no || r.invoice_date) && <><dt>Invoice</dt><dd>{[r.invoice_no, r.invoice_date && fmtDate(r.invoice_date)].filter(Boolean).join(' · ')}</dd></>}
            <dt>Received by</dt><dd>{r.by_name}, {fmtDateTime(r.at)}</dd>
            {r.decided_at && r.decided_by_name && <><dt>{r.status === 'APPROVED' ? 'Approved by' : r.status === 'REJECTED' ? 'Sent back by' : 'Cancelled by'}</dt><dd>{r.decided_by_name}, {fmtDateTime(r.decided_at)}{r.decision_note ? ` — “${r.decision_note}”` : ''}</dd></>}
            {r.note && <><dt>Note</dt><dd>{r.note}</dd></>}
          </dl>

          {r.flags.length > 0
            ? (
              <Card title="Differences to look at">
                <ul className="tally">
                  {r.flags.map((f) => <li key={f.text} className={f.tone === 'warn' ? 'tone-txt-LOW' : ''}><Icon name={f.tone === 'warn' ? 'alert' : 'help'} size={16} /><span className="grow">{f.text}</span></li>)}
                </ul>
              </Card>
            )
            : <Quiet>What was counted matches the note{r.po_ref ? ' and the order' : ''}.</Quiet>}

          <Card pad={false}>
            <Table rows={r.lines} columns={[
              { key: 'name', label: 'Item', primary: true, render: (l) => <span className="min0"><span className="row-label">{l.name}</span><span className="row-sub"><code>{l.code}</code>{l.note_text ? ` · on the note: “${l.note_text}”` : ''}{l.batch_no ? ` · lot ${l.batch_no}` : ''}{l.expiry ? ` · expires ${fmtDate(l.expiry)}` : ''}</span></span> },
              { key: 'qty', label: 'Counted', align: 'right', render: (l) => <b>{fmtQty(l.qty)} {l.uom}</b> },
              { key: 'note_qty', label: 'On the note', align: 'right', render: (l) => (l.note_qty === null ? <span className="faint">same</span> : fmtQty(l.note_qty)) },
              ...(r.po_ref ? [{ key: 'po_qty', label: 'Still on order', align: 'right', render: (l) => (l.po_qty === null ? '—' : fmtQty(l.po_qty)) }] : []),
              { key: 'unit_cost', label: 'Price', align: 'right', render: (l) => fmtMoney(l.unit_cost, currency) },
              { key: 'line', label: 'Line total', align: 'right', render: (l) => fmtMoney(l.qty * l.unit_cost, currency) },
            ]} />
          </Card>

          <Card title="Paperwork">
            {pending && needNote && !r.hasNote && <div className="note warn"><Icon name="alert" size={18} /><span>No delivery note is attached. It cannot be approved until one is.</span></div>}
            {r.files.length > 0 && (
              <ul className="lots">
                {r.files.map((f) => (
                  <li key={f.id} className="lot">
                    <div className="min0"><span className="row-label">{kinds[f.kind] || f.kind} · {f.name}</span>
                      <span className="row-sub">{f.uploaded_by_name}, {fmtDateTime(f.uploaded_at)} · {Math.max(1, Math.round(f.bytes / 1024))} KB · fingerprint {f.sha256.slice(0, 12)}</span></div>
                    <div className="lot-actions">
                      <Button kind="secondary" onClick={() => view(f)}>View</Button>
                      {pending && (f.uploaded_by === me.staffId || decides) && can('receive') && <Button kind="ghost" onClick={() => remove(f)}>Remove</Button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!r.files.length && <Quiet icon="help">Nothing attached yet.</Quiet>}
            {can('receive') && ['PENDING', 'APPROVED'].includes(r.status) && me.has?.files !== false && (
              <>
                <Paperwork files={files} setFiles={setFiles} kinds={kinds} needNote={false} />
                {files.length > 0 && <div className="row" style={{ justifyContent: 'flex-end' }}><Button busy={busy} onClick={attach}>Attach {files.length} file{files.length === 1 ? '' : 's'}</Button></div>}
              </>
            )}
          </Card>

          {pending && decides && mine && <div className="note"><Icon name="alert" size={18} />You recorded this delivery, so another manager approves it — unless you are the only one.</div>}
          {pending && (decides || mine) && <Field label="Note" hint="Needed when sending a delivery back: the receiver sees it."><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>}
          <ErrorNote error={err} />
        </>
      )}
    </Sheet>
  );
}
