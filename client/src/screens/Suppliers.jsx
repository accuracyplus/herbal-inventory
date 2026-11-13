/**
 * Suppliers: the list with each one's record, a page per supplier (how its orders went and what
 * it charges), and an item's prices from every supplier side by side.
 *
 * Nothing on these screens is typed in: prices are what approved deliveries cost, and the record
 * is the unit's own orders set against the deliveries that came.
 */

import { useState } from 'react';
import { KeyValues } from '@hifive/ui';
import { fmtDate, fmtMoney, post, put } from '../api.js';
import { Button, Card, Check, ErrorNote, Field, Loading, Page, Pill, Quiet, Sheet, Table, useApp, useData } from '../ui.jsx';
import { t, tn } from '../i18n.js';

// Each verdict's words are made when the pill is drawn, so they follow the language.
const VERDICT = {
  ON_TIME: ['ok', () => t('On time')],
  LATE: ['warn', (o) => tn(o.daysLate, '{n} day late', '{n} days late')],
  OVERDUE: ['danger', (o) => tn(o.daysLate, 'Overdue, {n} day', 'Overdue, {n} days')],
  WAITING: ['plain', () => t('Not due yet')],
  CLOSED_SHORT: ['warn', () => t('Closed short')],
  NO_DATE: ['plain', () => t('No date given')],
};
export const Verdict = ({ o }) => <Pill tone={VERDICT[o.verdict]?.[0]}>{VERDICT[o.verdict]?.[1](o) || o.verdict}</Pill>;

/** "4 of 5", or nothing when no order can yet be judged for time. */
const onTimeWords = (r) => (r && r.judged > 0 ? t('{a} of {b}', { a: r.onTime, b: r.judged }) : '');
const change = (n, currency) => (n === null || n === undefined || n === 0 ? '' : t(n > 0 ? 'up {amount}' : 'down {amount}', { amount: fmtMoney(Math.abs(n), currency) }));

export const priceViewer = (can) => can('cost.view') || can('po.edit') || can('receive');

export function SupplierList() {
  const { can, navigate } = useApp();
  const [all, setAll] = useState(false);
  const { data, error, loading, reload } = useData(`/api/suppliers${all ? '?all=1' : ''}`, [all]);
  const { data: record } = useData('/api/suppliers/record');
  const [editing, setEditing] = useState(null);
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Check checked={all} onChange={setAll}>Show suppliers no longer used</Check>
        {can('supplier.edit') && <Button icon="plus" kind="secondary" onClick={() => setEditing({})}>New supplier</Button>}
      </div>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table caption="Suppliers" rows={data} onRow={(s) => navigate(`purchasing/s/${s.id}`)} empty="No suppliers yet." columns={[
            { key: 'name', label: 'Supplier', primary: true, render: (s) => <span className="min0"><span className="row-label">{s.name} {!s.active && <Pill tone="plain">No longer used</Pill>}</span><span className="row-sub">{[s.contact, s.phone, s.email].filter(Boolean).join(' · ')}</span></span> },
            { key: 'on_time', label: 'On time, last 12 months', sortable: false, render: (s) => onTimeWords(record?.[s.id]) },
            { key: 'item_count', label: 'Usual supplier of', align: 'right', render: (s) => (s.item_count ? tn(s.item_count, '{n} item', '{n} items') : '') },
            { key: 'last_delivery', label: 'Last delivery', render: (s) => (s.last_delivery ? fmtDate(s.last_delivery) : '') },
          ]} />
        </Card>
      )}
      {editing && <SupplierForm s={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

export function SupplierPage({ id, onClose }) {
  const { can, currency, navigate } = useApp();
  const { data, error, loading, reload } = useData(`/api/suppliers/${id}`);
  const [editing, setEditing] = useState(false);
  const s = data?.supplier;
  const r = data?.record;
  return (
    <Page back={onClose} title={s ? s.name : 'Supplier'} subtitle={s ? [s.contact, s.phone, s.email].filter(Boolean).join(' · ') || undefined : undefined}
      actions={s && can('supplier.edit') && <Button kind="secondary" icon="edit" onClick={() => setEditing(true)}>Edit</Button>}>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <>
          {!s.active && <Quiet icon="info">This supplier is no longer used. Its history stays.</Quiet>}
          <div className="grid2">
            <div className="stack" style={{ gap: 18 }}>
              <Card title="How their orders went" hint={`The last twelve months of this unit's orders. On time means everything on the order had arrived by its expected date. An order with no expected date cannot be judged for time.`}>
                {r.orders === 0
                  ? <Quiet icon="info">No orders to them in the last twelve months.</Quiet>
                  : (
                    <KeyValues columns={3} items={[
                      { label: t('On time'), value: onTimeWords(r) || t('None judged yet') },
                      { label: t('Late'), value: r.late > 0 && `${r.late}${r.usualDaysLate ? `, ${tn(r.usualDaysLate, 'usually by {n} day', 'usually by {n} days')}` : ''}` },
                      { label: t('Overdue now'), value: r.overdue > 0 && r.overdue },
                      { label: t('Closed short'), value: r.closedShort > 0 && r.closedShort },
                      { label: t('Not due yet'), value: r.waiting > 0 && r.waiting },
                      { label: t('First delivery'), value: r.usualWaitDays !== null && (r.usualWaitDays === 0 ? t('usually the day it is approved') : tn(r.usualWaitDays, 'usually {n} day after approval', 'usually {n} days after approval')) },
                      { label: t('Lines short of the note'), value: data.againstNote.lines > 0 && t('{a} of {b}', { a: data.againstNote.short, b: data.againstNote.lines }) },
                    ]} />
                  )}
              </Card>

              {data.orders.length > 0 && (
                <Card title="Their orders" pad={false}>
                  <Table caption="Their orders" rows={data.orders} onRow={(o) => navigate(`purchasing/${o.id}`)} columns={[
                    { key: 'ref', label: 'Order', primary: true, render: (o) => <span className="row-label">{o.ref}</span> },
                    { key: 'expected', label: 'Expected', render: (o) => (o.expected ? fmtDate(o.expected) : '') },
                    { key: 'lastDay', label: 'Last delivery', render: (o) => (o.lastDay ? fmtDate(o.lastDay) : '') },
                    { key: 'verdict', label: 'How it went', sortable: false, render: (o) => <Verdict o={o} /> },
                    ...(data.prices ? [{ key: 'total', label: 'Value', align: 'right', render: (o) => fmtMoney(o.total, currency) }] : []),
                  ]} />
                </Card>
              )}
            </div>

            <div className="stack" style={{ gap: 18 }}>
              <Card title="Details">
                <KeyValues items={[
                  { label: t('Contact'), value: s.contact }, { label: t('Phone'), value: s.phone }, { label: t('Email'), value: s.email },
                  { label: t('TRN'), value: s.trn }, { label: t('Payment terms'), value: s.terms },
                  { label: t('Usual delivery time'), value: s.lead_days !== null && s.lead_days !== undefined && tn(s.lead_days, '{n} day', '{n} days') },
                ]} />
                {!s.email && <Quiet icon="info">No email address, so orders cannot be emailed to them.</Quiet>}
                {s.notes && <p className="muted">{s.notes}</p>}
              </Card>

              {data.prices && (
                <Card title="What they charge" pad={false} hint="The price on their last approved delivery of each item, and the change from the one before.">
                  {data.prices.length
                    ? <Table caption="What they charge" rows={data.prices} columns={[
                      { key: 'name', label: 'Item', primary: true, render: (p) => <span className="min0"><span className="row-label">{p.name}</span><span className="row-sub"><code>{p.code}</code> · {t('last {date}', { date: fmtDate(p.lastDay) })}</span></span> },
                      { key: 'last', label: 'Last paid', align: 'right', render: (p) => <b>{fmtMoney(p.last, currency)}</b> },
                      { key: 'change', label: 'Since before', align: 'right', sort: (p) => p.change ?? 0, render: (p) => change(p.change, currency) },
                    ]} />
                    : <Quiet icon="info">Nothing has been delivered by them with a price yet.</Quiet>}
                </Card>
              )}
            </div>
          </div>
        </>
      )}
      {editing && s && <SupplierForm s={s} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); }} />}
    </Page>
  );
}

/** An item's prices from every supplier, for the item window. */
export function ItemPrices({ id }) {
  const { currency, navigate } = useApp();
  const { data, error } = useData(`/api/items/${id}/prices`);
  if (error) return <ErrorNote error={error} />;
  if (!data) return null;
  return (
    <Card title="Prices" pad={false} hint="From approved deliveries. The lowest is marked when more than one supplier still in use has a price.">
      {data.suppliers.length
        ? <Table caption="Prices by supplier" rows={data.suppliers} rowKey={(s) => s.supplierId} onRow={(s) => navigate(`purchasing/s/${s.supplierId}`)} columns={[
          { key: 'name', label: 'Supplier', primary: true, render: (s) => <span className="min0"><span className="row-label">{s.name} {s.lowest && <Pill tone="ok">Lowest</Pill>} {!s.active && <Pill tone="plain">No longer used</Pill>}</span><span className="row-sub">{t('last {date}', { date: fmtDate(s.lastDay) })} · {tn(s.deliveries, '{n} delivery', '{n} deliveries')}</span></span> },
          { key: 'last', label: 'Last paid', align: 'right', render: (s) => <b>{fmtMoney(s.last, currency)}</b> },
          { key: 'change', label: 'Since before', align: 'right', sort: (s) => s.change ?? 0, render: (s) => change(s.change, currency) },
          { key: 'range', label: 'Last 12 months', align: 'right', sortable: false, render: (s) => (s.low === null ? '' : s.low === s.high ? fmtMoney(s.low, currency) : t('{low} to {high}', { low: fmtMoney(s.low, currency), high: fmtMoney(s.high, currency) })) },
        ]} />
        : <Quiet icon="info">Not bought yet, so there is no price to show.</Quiet>}
    </Card>
  );
}

export function SupplierForm({ s, onClose, onSaved }) {
  const { toast } = useApp();
  const [f, setF] = useState({ name: s.name || '', contact: s.contact || '', phone: s.phone || '', email: s.email || '', trn: s.trn || '', terms: s.terms || '', leadDays: s.lead_days ?? '', notes: s.notes || '', active: s.id ? !!s.active : true });
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    if (!f.name.trim()) { setTried(true); return; }
    setBusy(true); setErr(null);
    try { if (s.id) await put(`/api/suppliers/${s.id}`, f); else await post('/api/suppliers', f); toast('Supplier saved'); onSaved(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={s.id ? s.name : 'New supplier'} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
      <div className="form two">
        <Field label="Name" className="span2" error={tried && !f.name.trim() ? 'The supplier needs a name.' : undefined}><input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Contact person (optional)"><input value={f.contact} onChange={(e) => set('contact', e.target.value)} /></Field>
        <Field label="Phone (optional)"><input value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" /></Field>
        <Field label="Email (optional)" hint="Approved orders are emailed here."><input value={f.email} onChange={(e) => set('email', e.target.value)} inputMode="email" /></Field>
        <Field label="TRN (optional)" hint="UAE VAT registration number, printed on the purchase order."><input value={f.trn} onChange={(e) => set('trn', e.target.value)} /></Field>
        <Field label="Payment terms (optional)"><input value={f.terms} onChange={(e) => set('terms', e.target.value)} placeholder={t('30 days, cash on delivery')} /></Field>
        <Field label="Usual delivery time in days (optional)"><input type="number" min="0" value={f.leadDays} onChange={(e) => set('leadDays', e.target.value)} /></Field>
        <Field label="Notes (optional)" className="span2"><textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        {s.id && <div className="span2"><Check checked={!f.active} onChange={(v) => set('active', !v)}>No longer used</Check></div>}
      </div>
      <ErrorNote error={err} />
    </Sheet>
  );
}
