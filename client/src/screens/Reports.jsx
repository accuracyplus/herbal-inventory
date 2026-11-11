/**
 * Reports. Each one a table you can download, with a picture where the shape matters.
 * Nothing here ranks people: consumption is by item, category, room and day.
 */

import { useState } from 'react';
import { downloadCsv, fmtDate, fmtDateTime, fmtMoney, fmtQty, gstToday } from '../api.js';
import { Button, Card, ErrorNote, Field, Loading, Page, Pill, Quiet, SearchBox, Segmented, Select, Table, useApp, useData } from '../ui.jsx';

const ALL = [
  ['consumption', 'Usage'], ['valuation', 'Stock value'], ['expiry', 'Expiry'], ['ledger', 'Movements'],
  ['variance', 'Variances'], ['slow', 'Slow-moving'], ['purchases', 'Purchases'], ['legacy', 'Old app history'],
];
const RANGED = ['consumption', 'ledger', 'variance', 'purchases'];

export default function Reports() {
  const { route, can } = useApp();
  const tabs = ALL.filter(([k]) => (k === 'purchases' || k === 'valuation' ? can('cost.view') || k === 'valuation' : true));
  const [tab, setTab] = useState(route.query.get('r') || 'consumption');
  const [from, setFrom] = useState(gstToday(-29));
  const [to, setTo] = useState(gstToday());
  const [storeId, setStoreId] = useState('');
  const qs = new URLSearchParams();
  if (RANGED.includes(tab)) { qs.set('from', from); qs.set('to', to); }
  if (storeId && ['consumption', 'ledger'].includes(tab)) qs.set('store', storeId);
  const path = tab === 'legacy' ? '/api/legacy' : `/api/reports/${tab}?${qs}`;
  const { data, error, loading, reload } = useData(path, [path]);
  const { lists } = useApp();

  return (
    <Page title="Reports" subtitle="Download any table as CSV for Excel.">
      <Segmented label="Report" value={tab} onChange={setTab} options={tabs.map(([v, l]) => ({ value: v, label: l }))} />
      {RANGED.includes(tab) && (
        <Card>
          <div className="row">
            <Field label="From"><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="To"><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
            {['consumption', 'ledger'].includes(tab) && (
              <Field label="Store"><Select value={storeId} onChange={setStoreId} placeholder="All stores" options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            )}
            <div className="row" style={{ alignSelf: 'flex-end' }}>
              {[[7, '7 days'], [30, '30 days'], [90, '90 days']].map(([d, l]) => <Button key={d} kind="ghost" className="sm" onClick={() => { setFrom(gstToday(-(d - 1))); setTo(gstToday()); }}>{l}</Button>)}
            </div>
          </div>
        </Card>
      )}
      <ErrorNote error={error} onRetry={reload} />
      {loading && <Loading />}
      {data && !loading && (
        <>
          {tab === 'consumption' && <Consumption d={data} />}
          {tab === 'valuation' && <Valuation d={data} />}
          {tab === 'expiry' && <Expiry d={data} />}
          {tab === 'ledger' && <Ledger d={data} />}
          {tab === 'variance' && <Variance d={data} />}
          {tab === 'slow' && <Slow d={data} />}
          {tab === 'purchases' && <Purchases d={data} />}
          {tab === 'legacy' && <Legacy rows={data} />}
        </>
      )}
    </Page>
  );
}

function Bars({ rows, value = 'value', label = 'name', fmt }) {
  const max = Math.max(...rows.map((r) => Math.abs(r[value]) || 0), 1);
  if (!rows.length) return <Quiet>Nothing in this period.</Quiet>;
  return (
    <div className="bars">
      {rows.slice(0, 10).map((r) => (
        <div className="bar-row" key={r[label]}>
          <span className="bar-name" title={r[label]}>{r[label]}</span>
          <span className="bar-val">{fmt(r[value])}</span>
          <span className="bar-track"><span style={{ width: `${(Math.abs(r[value]) / max) * 100}%` }} /></span>
        </div>
      ))}
    </div>
  );
}

const Csv = ({ name, rows, cols }) => (rows?.length ? <Button kind="ghost" className="sm" icon="download" onClick={() => downloadCsv(`${name}.csv`, rows, cols)}>CSV</Button> : null);

function Consumption({ d }) {
  const { can, currency } = useApp();
  const money = can('cost.view');
  const by = money ? 'value' : 'qty';
  const fmt = money ? (v) => fmtMoney(v, currency, 0) : fmtQty;
  const max = Math.max(...d.byDay.map((x) => x[by] || 0), 1);
  return (
    <>
      <div className="grid2">
        <Card title={`By category${money ? ', at cost' : ''}`}><Bars rows={d.byCategory} value={by} fmt={fmt} /></Card>
        <Card title="By room or purpose"><Bars rows={d.byArea} value={money ? 'value' : 'times'} fmt={money ? fmt : (v) => `${v} times`} /></Card>
      </div>
      {d.byDay.length > 1 && (
        <Card title="Day by day" hint={`From ${fmtDate(d.from)} to ${fmtDate(d.to)}.`}>
          <div className="spark" role="img" aria-label={`Daily usage, highest ${fmt(max)}`}>
            {d.byDay.map((x) => <span key={x.day} title={`${fmtDate(x.day)}: ${fmt(x[by])}`} style={{ height: `${Math.max(2, (x[by] / max) * 100)}%` }} />)}
          </div>
        </Card>
      )}
      <Card title="By item" pad={false} actions={<Csv name={`usage-${d.from}-${d.to}`} rows={d.byItem} />}>
        <Table rows={d.byItem} rowKey={(r) => r.code} empty="Nothing was recorded as used in this period." columns={[
          { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code> · {r.category}</span></span> },
          { key: 'qty', label: 'Used', align: 'right', render: (r) => `${fmtQty(r.qty)} ${r.uom}` },
          { key: 'times', label: 'Times', align: 'right' },
          ...(money ? [{ key: 'value', label: 'Value', align: 'right', render: (r) => fmtMoney(r.value, currency) }] : []),
        ]} />
      </Card>
    </>
  );
}

function Valuation({ d }) {
  const { currency, can } = useApp();
  const money = can('cost.view');
  return (
    <>
      {money && (
        <div className="grid2">
          <Card title="By category" hint="Shelves, rooms and laundry, at weighted average cost."><Bars rows={d.byCategory} fmt={(v) => fmtMoney(v, currency, 0)} /></Card>
          <Card title="By store"><p className="tile-value">{fmtMoney(d.total, currency, 0)}</p><Bars rows={d.byStore} fmt={(v) => fmtMoney(v, currency, 0)} /></Card>
        </div>
      )}
      <Card title="On hand" pad={false} actions={<Csv name={`stock-value-${gstToday()}`} rows={d.rows} />}>
        <Table rows={d.rows} rowKey={(r, i) => `${r.code}-${r.store}-${i}`} columns={[
          { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code> · {r.category}</span></span> },
          { key: 'store', label: 'Store' },
          { key: 'qty', label: 'Shelf', align: 'right', render: (r) => `${fmtQty(r.qty)} ${r.uom}` },
          { key: 'out', label: 'Rooms / laundry', align: 'right', render: (r) => (r.in_use || r.in_wash ? `${fmtQty(r.in_use)} / ${fmtQty(r.in_wash)}` : '—') },
          { key: 'with_people', label: 'With people', align: 'right', render: (r) => (r.with_people ? fmtQty(r.with_people) : '—') },
          ...(money ? [{ key: 'avg_cost', label: 'Avg cost', align: 'right', render: (r) => fmtMoney(r.avg_cost, currency) }, { key: 'value', label: 'Value', align: 'right', render: (r) => fmtMoney(r.value, currency) }] : []),
        ]} />
      </Card>
    </>
  );
}

function Expiry({ d }) {
  const { currency, can } = useApp();
  const [show, setShow] = useState('due');
  const rows = d.rows.filter((r) => (show === 'due' ? ['EXPIRED', 'SOON', 'UNKNOWN'].includes(r.state) : true));
  return (
    <Card title={`Batches — warning ${d.warnDays} days ahead`} pad={false} actions={<><Segmented label="Show" value={show} onChange={setShow} options={[{ value: 'due', label: 'Needs attention' }, { value: 'all', label: 'All batches' }]} /><Csv name={`expiry-${gstToday()}`} rows={rows} /></>}>
      <Table rows={rows} rowKey={(r, i) => `${r.code}-${r.store}-${r.batch_no}-${i}`} empty="Nothing is expired, close to expiry, or missing a date." columns={[
        { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code>{r.batch_no ? ` · lot ${r.batch_no}` : ''}</span></span> },
        { key: 'store', label: 'Store' },
        { key: 'expiry', label: 'Expiry', sort: (r) => r.expiry || '9999', render: (r) => <span className="row">{r.expiry ? fmtDate(r.expiry) : '—'}<Pill status={r.state} /></span> },
        { key: 'days', label: 'Days', align: 'right', render: (r) => (r.days === null ? '—' : r.days) },
        { key: 'qty', label: 'Qty', align: 'right', render: (r) => `${fmtQty(r.qty)} ${r.uom}` },
        ...(can('cost.view') ? [{ key: 'value', label: 'Value', align: 'right', render: (r) => fmtMoney(r.value, currency) }] : []),
      ]} />
    </Card>
  );
}

const KIND = { RECEIPT: 'Received', ISSUE: 'Used', TRANSFER_OUT: 'Sent', TRANSFER_IN: 'Arrived', ADJUST: 'Correction', COUNT: 'Count', OPENING: 'Opening', LINEN: 'Linen', TAKE: 'Taken', RETURN: 'Returned' };

function Ledger({ d }) {
  const { can, currency } = useApp();
  const [q, setQ] = useState('');
  const rows = d.rows.filter((r) => !q || `${r.item} ${r.code} ${r.doc_ref || ''} ${r.actor_name || ''} ${r.area || ''}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="Every movement" pad={false} actions={<Csv name={`movements-${d.from}-${d.to}`} rows={rows} />}>
      <div style={{ padding: '0 18px' }}><SearchBox value={q} onChange={setQ} placeholder="Filter by item, reference, person, room" /></div>
      {d.capped && <p className="muted" style={{ padding: '0 18px' }}>Showing the latest 3,000. Narrow the dates to see older ones.</p>}
      <Table rows={rows} rowKey={(r, i) => `${r.at}-${i}`} empty="No movements in this period." columns={[
        { key: 'at', label: 'When', render: (r) => <span className="nowrap">{fmtDateTime(r.at)}</span> },
        { key: 'item', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.item}</span><span className="row-sub">{[KIND[r.kind], r.store, r.area, r.counterpart, r.doc_ref, r.reason].filter(Boolean).join(' · ')}</span></span> },
        { key: 'qty', label: 'Qty', align: 'right', render: (r) => <b>{r.kind !== 'LINEN' && r.qty > 0 ? '+' : ''}{fmtQty(r.qty)}</b> },
        { key: 'balance_after', label: 'After', align: 'right', render: (r) => fmtQty(r.balance_after) },
        ...(can('cost.view') ? [{ key: 'value', label: 'Value', align: 'right', render: (r) => fmtMoney(r.value, currency) }] : []),
        { key: 'actor_name', label: 'By' },
      ]} />
    </Card>
  );
}

function Variance({ d }) {
  const { currency, can } = useApp();
  const money = can('cost.view');
  return (
    <>
      <Card title="Corrections by reason"><Bars rows={d.byReason} value={money ? 'value' : 'qty'} fmt={money ? (v) => fmtMoney(v, currency) : fmtQty} /></Card>
      <Card title="Count differences posted" pad={false} actions={<Csv name={`count-variances-${d.from}-${d.to}`} rows={d.counts} />}>
        <Table rows={d.counts} rowKey={(r, i) => `${r.ref}-${r.code}-${i}`} empty="No count differences in this period." columns={[
          { key: 'at', label: 'When', render: (r) => fmtDate(r.at) },
          { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub">{r.ref} · {r.store}</span></span> },
          { key: 'qty', label: 'Difference', align: 'right', render: (r) => <b>{r.qty > 0 ? '+' : ''}{fmtQty(r.qty)}</b> },
          ...(money ? [{ key: 'value', label: 'Value', align: 'right', render: (r) => fmtMoney(r.value, currency) }] : []),
        ]} />
      </Card>
    </>
  );
}

function Slow({ d }) {
  const { currency, can } = useApp();
  return (
    <Card title={`Not used for ${d.days} days or more`} pad={false} actions={<Csv name={`slow-moving-${gstToday()}`} rows={d.rows} />}>
      <Table rows={d.rows} rowKey={(r) => r.code} empty="Everything held has been used recently." columns={[
        { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code> · {r.category}</span></span> },
        { key: 'qty', label: 'On shelf', align: 'right', render: (r) => `${fmtQty(r.qty)} ${r.uom}` },
        { key: 'last_used', label: 'Last used', render: (r) => (r.last_used ? fmtDate(r.last_used) : 'Never') },
        ...(can('cost.view') ? [{ key: 'value', label: 'Value tied up', align: 'right', render: (r) => fmtMoney(r.value, currency) }] : []),
      ]} />
    </Card>
  );
}

function Purchases({ d }) {
  const { currency } = useApp();
  return (
    <>
      <Card title="By supplier"><Bars rows={d.bySupplier} fmt={(v) => fmtMoney(v, currency, 0)} /></Card>
      <Card title="Deliveries" pad={false} actions={<Csv name={`deliveries-${d.from}-${d.to}`} rows={d.receipts} />}>
        <Table rows={d.receipts} rowKey={(r) => r.ref} empty="No deliveries in this period." columns={[
          { key: 'at', label: 'When', render: (r) => fmtDate(r.at) },
          { key: 'ref', label: 'Delivery', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.ref} · {r.supplier || 'No supplier'}</span><span className="row-sub">{[r.store, r.po_ref, r.invoice_no && `invoice ${r.invoice_no}`].filter(Boolean).join(' · ')}</span></span> },
          { key: 'total', label: 'Total', align: 'right', render: (r) => fmtMoney(r.total, currency) },
          { key: 'by_name', label: 'Received by' },
        ]} />
      </Card>
    </>
  );
}

function Legacy({ rows }) {
  const [q, setQ] = useState('');
  const shown = rows.filter((r) => !q || `${r.item_name} ${r.staff} ${r.purpose}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="History from the old Google Sheet app" hint="Kept for reference exactly as it was. It is not part of today's stock figures, which start from the imported opening balances." pad={false}
      actions={<Csv name="old-app-history" rows={shown} />}>
      <div style={{ padding: '0 18px' }}><SearchBox value={q} onChange={setQ} placeholder="Filter by item, person or room" /></div>
      <Table rows={shown} rowKey={(r, i) => i} empty="No history was imported." columns={[
        { key: 'at', label: 'When' }, { key: 'item_name', label: 'Item', primary: true }, { key: 'type', label: 'Type' },
        { key: 'qty', label: 'Qty', align: 'right' }, { key: 'store', label: 'Store' }, { key: 'staff', label: 'Staff' }, { key: 'purpose', label: 'Purpose' },
      ]} />
    </Card>
  );
}
