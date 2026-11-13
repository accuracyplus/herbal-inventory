/**
 * Accounts (feature 14, `accounting.on`): exports for the accounts system, and month close.
 *
 * A closed month cannot change: nothing dated in it can be posted, whichever screen tries, and a
 * credit note cannot be dated in it. Only a past month can be closed; the unit administrator
 * reopens one with a reason, and both are in the activity log.
 */

import { useState } from 'react';
import { downloadCsv, fmtDateTime, get, post } from '../api.js';
import { dateLocale, t, tn } from '../i18n.js';
import { Button, Card, ErrorNote, Field, Loading, Page, Quiet, Select, Sheet, Table, useApp, useData } from '../ui.jsx';

const gstDay = (ms = Date.now()) => new Date(ms + 4 * 36e5).toISOString().slice(0, 10);
const monthName = (m) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
const label = (k) => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');

/** The calendar month before this one, as its first and last day. */
function lastMonth() {
  const today = gstDay();
  const first = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
  const end = new Date(first.getTime() - 864e5);
  return { from: `${end.toISOString().slice(0, 7)}-01`, to: end.toISOString().slice(0, 10) };
}

export default function Accounts() {
  const { can } = useApp();
  return (
    <Page title="Accounts" subtitle="Exports for the accounts system, and closing a month so nothing in it can change.">
      <Exports />
      <MonthClose admin={can('admin')} />
    </Page>
  );
}

function Exports() {
  const { me, toast } = useApp();
  const kinds = me.labels.exports || {};
  const [kind, setKind] = useState('purchases');
  const [range, setRange] = useState(lastMonth);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const run = async () => {
    setBusy(true); setErr(null);
    try {
      const rows = await get(`/api/accounts/export?kind=${kind}&from=${range.from}&to=${range.to}`);
      if (!rows.length) { toast('Nothing in those dates'); return; }
      downloadCsv(`${kind}-${range.from}-to-${range.to}.csv`, rows, Object.keys(rows[0]).map((k) => ({ key: k, label: label(k) })));
      toast(tn(rows.length, '{n} row downloaded', '{n} rows downloaded'));
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Card title="Exports" hint="A CSV file that opens in Excel. Costs are without VAT; VAT is in its own column. Purchases are dated the day they were approved onto the shelf.">
      <div className="form two">
        <Field label="What" className="span2"><Select value={kind} onChange={setKind} options={Object.entries(kinds).map(([value, l]) => ({ value, label: l }))} /></Field>
        <Field label="From"><input type="date" value={range.from} max={gstDay()} onChange={(e) => setRange({ ...range, from: e.target.value })} /></Field>
        <Field label="To"><input type="date" value={range.to} max={gstDay()} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Field>
      </div>
      <ErrorNote error={err} />
      <div className="row" style={{ justifyContent: 'flex-end' }}><Button busy={busy} icon="download" onClick={run}>Download the CSV</Button></div>
    </Card>
  );
}

function MonthClose({ admin }) {
  const { toast } = useApp();
  const { data, error, loading, reload } = useData('/api/periods');
  const [month, setMonth] = useState('');
  const [note, setNote] = useState('');
  const [reopening, setReopening] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const closed = new Set((data || []).map((p) => p.month));
  // The last twelve months that are over and still open.
  const choices = [];
  const now = new Date(`${gstDay().slice(0, 7)}-15T12:00:00Z`);
  for (let i = 1; i <= 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15));
    const m = d.toISOString().slice(0, 7);
    if (!closed.has(m)) choices.push({ value: m, label: monthName(m) });
  }
  const close = async () => {
    if (!month) { setErr(new Error('Choose the month to close.')); return; }
    setBusy(true); setErr(null);
    try { await post('/api/periods/close', { month, note }); toast(t('{month} closed', { month: monthName(month) })); setMonth(''); setNote(''); reload(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Card title="Month close" hint="Close a month once its figures have gone to the accounts. Nothing dated in it can then be recorded or changed.">
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.length && <Quiet icon="info">No month is closed yet.</Quiet>}
      {data?.length > 0 && (
        <Table caption="Closed months" rows={data} rowKey={(p) => p.month} columns={[
          { key: 'month', label: 'Month', primary: true, render: (p) => <span className="min0"><span className="row-label">{monthName(p.month)}</span>{p.note ? <span className="row-sub">{p.note}</span> : null}</span> },
          { key: 'closed_at', label: 'Closed', render: (p) => `${fmtDateTime(p.closed_at)}, ${p.closed_by_name}` },
          ...(admin ? [{ key: 'reopen', label: '', sortable: false, render: (p) => <Button kind="ghost" onClick={() => setReopening(p.month)}>Reopen</Button> }] : []),
        ]} />
      )}
      {admin && (
        <div className="form two">
          <Field label="Close a month"><Select value={month} onChange={setMonth} placeholder="Choose" options={choices} /></Field>
          <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={t('Sent to the accountant on 3 December')} /></Field>
        </div>
      )}
      <ErrorNote error={err} />
      {admin && <div className="row" style={{ justifyContent: 'flex-end' }}><Button busy={busy} onClick={close}>{month ? t('Close {month}', { month: monthName(month) }) : t('Close the month')}</Button></div>}
      {!admin && <Quiet icon="info">The unit administrator closes and reopens months.</Quiet>}
      {reopening && <Reopen month={reopening} onClose={() => setReopening(null)} onDone={() => { setReopening(null); reload(); }} />}
    </Card>
  );
}

function Reopen({ month, onClose, onDone }) {
  const { toast } = useApp();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const go = async () => {
    setBusy(true); setErr(null);
    try { await post('/api/periods/reopen', { month, reason }); toast(t('{month} reopened', { month: monthName(month) })); onDone(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={t('Reopen {month}', { month: monthName(month) })} onClose={onClose} footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={go}>Reopen it</Button></>}>
      <p className="muted">{t('Its figures may already be with the accounts. Whatever is changed now will differ from what they have.')}</p>
      <Field label="Why"><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder={t('A delivery invoice arrived late')} /></Field>
      <ErrorNote error={err} />
    </Sheet>
  );
}
