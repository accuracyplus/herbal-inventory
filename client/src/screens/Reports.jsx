/**
 * Reports. Each one a table you can download, with a picture where the shape matters.
 * Nothing here ranks people or units: cost per person and the summary across units are in name
 * order, and their columns cannot be sorted.
 */

import { useState } from 'react';
import { downloadCsv, fmtDate, fmtDateTime, fmtMoney, fmtQty, gstToday } from '../api.js';
import { dateLocale, t, tn } from '../i18n.js';
import { Boundary, Button, Card, ErrorNote, Field, Loading, Page, Pill, Quiet, SearchBox, Segmented, Select, Table, useApp, useData } from '../ui.jsx';

export const ALL = [
  ['consumption', 'Usage'], ['services', 'Services'], ['people', 'By person'], ['group', 'Group summary'], ['valuation', 'Stock value'], ['expiry', 'Expiry'], ['ledger', 'Movements'],
  ['variance', 'Variances'], ['slow', 'Slow-moving'], ['purchases', 'Purchases'], ['legacy', 'Old app history'],
];
const RANGED = ['consumption', 'services', 'people', 'ledger', 'variance', 'purchases'];
const BY_STORE = ['consumption', 'people', 'ledger'];

/** Where each report is asked for. */
export function reportPath(tab, { from, to, month, storeId } = {}) {
  if (tab === 'legacy') return '/api/legacy';
  if (tab === 'group') return `/api/group/monthly?month=${month}`;
  const qs = new URLSearchParams();
  if (RANGED.includes(tab)) { qs.set('from', from); qs.set('to', to); }
  if (storeId && BY_STORE.includes(tab)) qs.set('store', storeId);
  return `/api/reports/${tab}?${qs}`;
}

/** The report a link asks for (#/reports?r=expiry), when it is one this person has; otherwise the first. */
export const startingReport = (asked, tabs) => (tabs.some(([k]) => k === asked) ? asked : tabs[0][0]);

export default function Reports() {
  const { route, can, me } = useApp();
  const tabs = ALL.filter(([k]) => {
    if (k === 'people') return can('cost.people');
    if (k === 'group') return me.groupSummary;
    return k === 'purchases' ? can('cost.view') : true;
  });
  const word = me.settings['services.word'] || 'Services';
  const [tab, setTab] = useState(() => startingReport(route.query.get('r'), tabs));
  const [from, setFrom] = useState(gstToday(-29));
  const [to, setTo] = useState(gstToday());
  const [month, setMonth] = useState(gstToday().slice(0, 7));
  const [storeId, setStoreId] = useState('');
  const path = reportPath(tab, { from, to, month, storeId });
  const { data, error, loading, reload } = useData(path, [path]);
  const { lists } = useApp();

  return (
    <Page title="Reports" subtitle="What was used, bought and held, and what it cost. Any table downloads as a sheet.">
      <Segmented label="Report" value={tab} onChange={setTab} options={tabs.map(([v, l]) => ({ value: v, label: v === 'services' ? word : l }))} />
      {RANGED.includes(tab) && (
        <div className="stack" style={{ gap: 4 }}>
          <div className="form three" style={{ maxWidth: 760 }}>
            <Field label="From"><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="To"><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
            {BY_STORE.includes(tab) && (
              <Field label="Store"><Select value={storeId} onChange={setStoreId} placeholder="All stores" options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            )}
          </div>
          <div className="row">
            {[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']].map(([d, l]) => <Button key={d} kind="ghost" onClick={() => { setFrom(gstToday(-(d - 1))); setTo(gstToday()); }}>{l}</Button>)}
          </div>
        </div>
      )}
      {tab === 'group' && <div className="form three" style={{ maxWidth: 760 }}><Field label="Month"><input type="month" value={month} max={gstToday().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field></div>}
      <ErrorNote error={error} onRetry={reload} />
      {loading && <Loading />}
      {data && !loading && (
        <Boundary where={`the ${tab} report`} resetKey={path}>
          <ReportBody tab={tab} data={data} word={word} />
        </Boundary>
      )}
    </Page>
  );
}

const list = (v) => Array.isArray(v);
/**
 * The shape each report's answer has. A panel is drawn only for an answer of its own shape, so a
 * report never reads another's numbers, even for the one render after the tab changes.
 */
export const FITS = {
  consumption: (d) => list(d?.byDepartment) && list(d.byCategory) && list(d.byArea) && list(d.byDay) && list(d.byItem),
  services: (d) => list(d?.byService) && list(d.byItem) && list(d.byArea),
  people: (d) => list(d?.rows) && 'from' in d,
  group: (d) => !!d?.totals && list(d.rows),
  valuation: (d) => list(d?.rows) && list(d.byCategory) && list(d.byStore),
  expiry: (d) => list(d?.rows) && 'warnDays' in d,
  ledger: (d) => list(d?.rows) && 'from' in d && !('byReason' in d),
  variance: (d) => list(d?.byReason) && list(d.counts),
  slow: (d) => list(d?.rows) && 'days' in d,
  purchases: (d) => list(d?.bySupplier) && list(d.receipts),
  legacy: (d) => list(d),
};

/** The chosen report's panel, or nothing while the answer in hand is not this report's. */
export function ReportBody({ tab, data, word = 'Services' }) {
  if (!FITS[tab]?.(data)) return null;
  switch (tab) {
    case 'consumption': return <Consumption d={data} />;
    case 'services': return <ServiceUse d={data} word={word} />;
    case 'people': return <People d={data} />;
    case 'group': return <Group d={data} />;
    case 'valuation': return <Valuation d={data} />;
    case 'expiry': return <Expiry d={data} />;
    case 'ledger': return <Ledger d={data} />;
    case 'variance': return <Variance d={data} />;
    case 'slow': return <Slow d={data} />;
    case 'purchases': return <Purchases d={data} />;
    case 'legacy': return <Legacy rows={data} />;
    default: return null;
  }
}

export function Bars({ rows, value = 'value', label = 'name', fmt }) {
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

const Csv = ({ name, rows, cols }) => (rows?.length ? <Button kind="ghost" icon="download" onClick={() => downloadCsv(`${name}.csv`, rows, cols)}>Sheet</Button> : null);

function Consumption({ d }) {
  const { can, currency } = useApp();
  const money = can('cost.view');
  const by = money ? 'value' : 'qty';
  const fmt = money ? (v) => fmtMoney(v, currency, 0) : fmtQty;
  const max = Math.max(...d.byDay.map((x) => x[by] || 0), 1);
  return (
    <>
      <div className="grid2">
        <Card title={money ? 'By category, at cost' : 'By category'} actions={<Csv name={`usage-by-category-${d.from}-${d.to}`} rows={d.byCategory} />}><Bars rows={d.byCategory} value={by} fmt={fmt} /></Card>
        <Card title="By room or purpose" actions={<Csv name={`usage-by-room-${d.from}-${d.to}`} rows={d.byArea} />}><Bars rows={d.byArea} value={money ? 'value' : 'times'} fmt={money ? fmt : (v) => t('{n} times', { n: v })} /></Card>
      </div>
      {d.byDepartment.length > 0 && (
        <Card title="By department" hint="The department a room belonged to when the stock was used. Listed by name." actions={<Csv name={`usage-by-department-${d.from}-${d.to}`} rows={d.byDepartment} />}>
          <Bars rows={d.byDepartment} value={money ? 'value' : 'times'} fmt={money ? fmt : (v) => t('{n} times', { n: v })} />
        </Card>
      )}
      {d.byDay.length > 1 && (
        <Card title="Day by day" hint={t('From {from} to {to}.', { from: fmtDate(d.from), to: fmtDate(d.to) })}>
          <div className="spark" role="img" aria-label={t('Daily usage, highest {max}', { max: fmt(max) })}>
            {d.byDay.map((x) => <span key={x.day} title={`${fmtDate(x.day)}: ${fmt(x[by])}`} style={{ height: `${Math.max(2, (x[by] / max) * 100)}%` }} />)}
          </div>
        </Card>
      )}
      <Card title="By item" pad={false} actions={<Csv name={`usage-${d.from}-${d.to}`} rows={d.byItem} />}>
        <Table rows={d.byItem} rowKey={(r) => r.code} empty="Nothing was recorded as used in this period." columns={[
          { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code> · {r.category}</span></span> },
          { key: 'qty', label: 'Used', align: 'right', render: (r) => `${fmtQty(r.qty)} ${t(r.uom)}` },
          { key: 'times', label: 'Times', align: 'right' },
          ...(money ? [{ key: 'value', label: 'Value', align: 'right', render: (r) => fmtMoney(r.value, currency) }] : []),
        ]} />
      </Card>
    </>
  );
}

/** Actual use against the recipes. A difference is a plain number with its sign, not a verdict. */
function ServiceUse({ d, word }) {
  const { can, currency } = useApp();
  const money = can('cost.view');
  const m = (v) => fmtMoney(v, currency);
  const diff = (a, b, f = fmtQty) => { const x = +(a - b).toFixed(3); return x === 0 ? <span className="faint">{t('none')}</span> : <b>{x > 0 ? '+' : '−'}{f(Math.abs(x))}</b>; };
  const valueCols = money ? [
    { key: 'std_value', label: 'By the recipe', align: 'right', sortable: false, render: (r) => m(r.std_value) },
    { key: 'value', label: 'Actually used', align: 'right', sortable: false, render: (r) => m(r.value) },
    { key: 'diff', label: 'Difference', align: 'right', sortable: false, render: (r) => diff(r.value, r.std_value, m) },
  ] : [];
  const csvCols = (first) => [first, { key: 'times', label: 'Done' }, ...(money ? [{ key: 'std_value', label: `By the recipe (${currency})` }, { key: 'value', label: `Actually used (${currency})` }] : [])];
  const one = word.replace(/s$/, '');
  return (
    <>
      <Card title={t('By {one}', { one: t(one.toLowerCase()) })} hint="What the recipes said should be used for the number done, beside what was recorded as used, at each item's cost at the time." pad={false}
        actions={<Csv name={`${word.toLowerCase()}-${d.from}-${d.to}`} rows={d.byService} cols={csvCols({ key: 'name', label: one })} />}>
        <Table rows={d.byService} rowKey={(r) => r.service_id} empty={t('No {word} were recorded in this period.', { word: t(word.toLowerCase()) })} columns={[
          { key: 'name', label: one, primary: true, sortable: false }, { key: 'times', label: 'Done', align: 'right', sortable: false }, ...valueCols,
        ]} />
      </Card>
      {d.margin?.length > 0 && (
        <Card title="Price and margin" hint="What was charged less what was actually used, for those recorded with a price (sent by billing, or the usual price on the recipe). Listed by name." pad={false}
          actions={<Csv name={`${word.toLowerCase()}-margin-${d.from}-${d.to}`} rows={d.margin} cols={[{ key: 'name', label: one }, { key: 'times', label: 'Done' }, { key: 'revenue', label: `Charged (${currency})` }, { key: 'cost', label: `Used (${currency})` }, { key: 'margin', label: `Margin (${currency})` }, { key: 'percent', label: 'Margin %' }]} />}>
          <Table rows={d.margin} rowKey={(r) => r.service_id} columns={[
            { key: 'name', label: one, primary: true, sortable: false }, { key: 'times', label: 'Done', align: 'right', sortable: false },
            { key: 'revenue', label: 'Charged', align: 'right', sortable: false, render: (r) => m(r.revenue) },
            { key: 'cost', label: 'Used', align: 'right', sortable: false, render: (r) => m(r.cost) },
            { key: 'margin', label: 'Margin', align: 'right', sortable: false, render: (r) => <b>{m(r.margin)}</b> },
            { key: 'percent', label: '%', align: 'right', sortable: false, render: (r) => (r.percent === null ? '' : `${r.percent}%`) },
          ]} />
          {d.unpriced > 0 && <p className="muted" style={{ padding: '0 18px 14px' }}>{tn(d.unpriced, '{n} more was recorded with no price, and is left out of the margin.', '{n} more were recorded with no price, and are left out of the margin.')}</p>}
        </Card>
      )}
      {d.byItem.length > 0 && (
        <Card title="By item" hint="Where the difference comes from: each item's quantity by the recipe and as used." pad={false}
          actions={<Csv name={`${word.toLowerCase()}-items-${d.from}-${d.to}`} rows={d.byItem} cols={[{ key: 'service', label: one }, { key: 'code', label: 'Code' }, { key: 'name', label: 'Item' }, { key: 'uom', label: 'Unit' }, { key: 'std_qty', label: 'By the recipe' }, { key: 'qty', label: 'Used' }]} />}>
          <Table rows={d.byItem} rowKey={(r) => `${r.service_id}-${r.code}`} columns={[
            { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub">{r.service}</span></span> },
            { key: 'std_qty', label: 'By the recipe', align: 'right', render: (r) => `${fmtQty(r.std_qty)} ${t(r.uom)}` },
            { key: 'qty', label: 'Used', align: 'right', render: (r) => `${fmtQty(r.qty)} ${t(r.uom)}` },
            { key: 'diff', label: 'Difference', align: 'right', sort: (r) => r.qty - r.std_qty, render: (r) => diff(r.qty, r.std_qty) },
          ]} />
        </Card>
      )}
      {d.byArea.length > 0 && (
        <Card title="By room" pad={false} actions={<Csv name={`${word.toLowerCase()}-rooms-${d.from}-${d.to}`} rows={d.byArea} cols={csvCols({ key: 'name', label: 'Room' })} />}>
          <Table rows={d.byArea} rowKey={(r) => r.name} columns={[{ key: 'name', label: 'Room', primary: true, sortable: false }, { key: 'times', label: 'Done', align: 'right', sortable: false }, ...valueCols]} />
        </Card>
      )}
      {d.byPerson?.length > 0 && (
        <Card title="By person" hint="Only managers and administrators see this. Listed by name: this is a record, not a ranking." pad={false}
          actions={<Csv name={`${word.toLowerCase()}-people-${d.from}-${d.to}`} rows={d.byPerson} cols={csvCols({ key: 'name', label: 'Person' })} />}>
          <Table rows={d.byPerson} rowKey={(r) => r.person_id ?? 'none'} columns={[{ key: 'name', label: 'Person', primary: true, sortable: false }, { key: 'times', label: 'Done', align: 'right', sortable: false }, ...valueCols]} />
        </Card>
      )}
    </>
  );
}

function People({ d }) {
  const { currency } = useApp();
  return (
    <Card title="Cost of stock used, by person" hint="Only managers and administrators see this page. Each person sees their own figures under With me. Listed by name: this is a record, not a ranking." pad={false}
      actions={<Csv name={`usage-by-person-${d.from}-${d.to}`} rows={d.rows} cols={[{ key: 'name', label: 'Person' }, { key: 'code', label: 'Employee code' }, { key: 'times', label: 'Times' }, { key: 'value', label: `Cost (${currency})` }]} />}>
      <Table rows={d.rows} rowKey={(r) => r.person_id ?? 'none'} empty="Nothing was recorded as used in this period." columns={[
        { key: 'name', label: 'Person', primary: true, sortable: false, render: (r) => <span className="min0"><span className="row-label">{r.name}</span>{r.code && <span className="row-sub"><code>{r.code}</code></span>}</span> },
        { key: 'times', label: 'Times', align: 'right', sortable: false },
        { key: 'value', label: 'Cost', align: 'right', sortable: false, render: (r) => fmtMoney(r.value, currency) },
      ]} />
    </Card>
  );
}

function Group({ d }) {
  const { currency } = useApp();
  const m = (v) => fmtMoney(v, currency, 0);
  const title = new Date(`${d.month}-01T00:00:00+04:00`).toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' });
  return (
    <>
      <dl className="hf-kv hf-kv--3">
        <div><dt>{t('Used')}</dt><dd>{m(d.totals.used)}</dd></div>
        <div><dt>{t('Received')}</dt><dd>{m(d.totals.received)}</dd></div>
        <div><dt>{t('Written off')}</dt><dd>{m(d.totals.writtenOff)}</dd></div>
        <div><dt>{t('Stock value now')}</dt><dd>{m(d.totals.stockValueNow)}</dd></div>
      </dl>
      <Card title={title} hint="Counts and totals for each unit, listed by name. Stock value and unaccounted items are as they stand today, whichever month is chosen." pad={false}
        actions={<Csv name={`group-summary-${d.month}`} rows={d.rows} cols={[
          { key: 'unit', label: 'Unit' }, { key: 'lines', label: 'Lines used' }, { key: 'used', label: `Used (${currency})` }, { key: 'deliveries', label: 'Deliveries' },
          { key: 'received', label: `Received (${currency})` }, { key: 'writtenOff', label: `Written off (${currency})` }, { key: 'stockValueNow', label: `Stock value now (${currency})` }, { key: 'unaccountedNow', label: 'Unaccounted now' },
        ]} />}>
        <Table rows={d.rows} rowKey={(r) => r.code} empty="No units yet." columns={[
          { key: 'unit', label: 'Unit', primary: true, sortable: false },
          { key: 'lines', label: 'Lines used', align: 'right', sortable: false },
          { key: 'used', label: 'Used', align: 'right', sortable: false, render: (r) => m(r.used) },
          { key: 'deliveries', label: 'Deliveries', align: 'right', sortable: false },
          { key: 'received', label: 'Received', align: 'right', sortable: false, render: (r) => m(r.received) },
          { key: 'writtenOff', label: 'Written off', align: 'right', sortable: false, render: (r) => m(r.writtenOff) },
          { key: 'stockValueNow', label: 'Stock value now', align: 'right', sortable: false, render: (r) => m(r.stockValueNow) },
          { key: 'unaccountedNow', label: 'Unaccounted now', align: 'right', sortable: false },
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
          <Card title="By store"><p className="inv-number">{fmtMoney(d.total, currency, 0)}</p><Bars rows={d.byStore} fmt={(v) => fmtMoney(v, currency, 0)} /></Card>
        </div>
      )}
      <Card title="On hand" pad={false} actions={<Csv name={`stock-value-${gstToday()}`} rows={d.rows} />}>
        <Table rows={d.rows} rowKey={(r, i) => `${r.code}-${r.store}-${i}`} columns={[
          { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code> · {r.category}</span></span> },
          { key: 'store', label: 'Store' },
          { key: 'qty', label: 'Shelf', align: 'right', render: (r) => `${fmtQty(r.qty)} ${t(r.uom)}` },
          { key: 'out', label: 'Rooms / laundry', align: 'right', render: (r) => (r.in_use || r.in_wash ? `${fmtQty(r.in_use)} / ${fmtQty(r.in_wash)}` : '') },
          { key: 'with_people', label: 'With people', align: 'right', render: (r) => (r.with_people ? fmtQty(r.with_people) : '') },
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
    <Card title={t('Batches, warned {n} days ahead', { n: d.warnDays })} pad={false} actions={<><Segmented label="Show" value={show} onChange={setShow} options={[{ value: 'due', label: 'Needs attention' }, { value: 'all', label: 'All batches' }]} /><Csv name={`expiry-${gstToday()}`} rows={rows} /></>}>
      <Table rows={rows} rowKey={(r, i) => `${r.code}-${r.store}-${r.batch_no}-${i}`} empty="Nothing is expired, close to expiry, or missing a date." columns={[
        { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code>{r.batch_no ? ` · ${t('lot {lot}', { lot: r.batch_no })}` : ''}</span></span> },
        { key: 'store', label: 'Store' },
        { key: 'expiry', label: 'Expiry', sort: (r) => r.expiry || '9999', render: (r) => <span className="row">{r.expiry ? fmtDate(r.expiry) : ''}<Pill status={r.state} /></span> },
        { key: 'days', label: 'Days', align: 'right', render: (r) => (r.days === null ? '' : r.days) },
        { key: 'qty', label: 'Qty', align: 'right', render: (r) => `${fmtQty(r.qty)} ${t(r.uom)}` },
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
      {d.capped && <p className="muted" style={{ padding: '0 18px' }}>{t('Showing the latest 3,000. Narrow the dates to see older ones.')}</p>}
      <Table rows={rows} rowKey={(r, i) => `${r.at}-${i}`} empty="No movements in this period." columns={[
        { key: 'at', label: 'When', render: (r) => <span className="nowrap">{fmtDateTime(r.at)}</span> },
        { key: 'item', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.item}</span><span className="row-sub">{[t(KIND[r.kind]), r.store, r.area, r.counterpart, r.doc_ref, r.reason].filter(Boolean).join(' · ')}</span></span> },
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
    <Card title={t('Not used for {n} days or more', { n: d.days })} pad={false} actions={<Csv name={`slow-moving-${gstToday()}`} rows={d.rows} />}>
      <Table rows={d.rows} rowKey={(r) => r.code} empty="Everything held has been used recently." columns={[
        { key: 'name', label: 'Item', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name}</span><span className="row-sub"><code>{r.code}</code> · {r.category}</span></span> },
        { key: 'qty', label: 'On shelf', align: 'right', render: (r) => `${fmtQty(r.qty)} ${t(r.uom)}` },
        { key: 'last_used', label: 'Last used', render: (r) => (r.last_used ? fmtDate(r.last_used) : t('Never')) },
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
          { key: 'ref', label: 'Delivery', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.ref} · {r.supplier || t('No supplier')}</span><span className="row-sub">{[r.store, r.po_ref, r.invoice_no && t('invoice {no}', { no: r.invoice_no })].filter(Boolean).join(' · ')}</span></span> },
          { key: 'total', label: 'Total', align: 'right', render: (r) => fmtMoney(r.total, currency) },
          { key: 'by_name', label: 'Received by' },
        ]} />
      </Card>
    </>
  );
}

function Legacy({ rows }) {
  const [q, setQ] = useState('');
  const shown = (Array.isArray(rows) ? rows : []).filter((r) => !q || `${r.item_name} ${r.staff} ${r.purpose}`.toLowerCase().includes(q.toLowerCase()));
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
