/**
 * Suggested levels: what each store's reorder, critical and top-up levels would be from its real
 * use, beside what is set now. A manager ticks the ones to take, changes any number first, and
 * sets them in one go. Nothing changes by itself.
 */

import { useEffect, useMemo, useState } from 'react';
import { fmtQty, post } from '../api.js';
import { Button, Card, Check, ErrorNote, Field, Loading, Note, Pill, QtyInput, Quiet, Segmented, Select, Table, useApp, useData } from '../ui.jsx';

const days = (n) => `${n} day${Number(n) === 1 ? '' : 's'}`;

/** `start` opens on one store's items with no levels yet: where What to buy's note sends people. */
export default function Levels({ start = '' }) {
  const { lists, can, toast, refreshStock } = useApp();
  const stores = [...lists.stores.filter((s) => s.kind === 'MAIN'), ...lists.stores.filter((s) => s.kind !== 'MAIN')];
  const [chosen, setStoreId] = useState(start);
  const storeId = chosen || stores[0]?.id || '';
  const { data, error, loading, reload } = useData(storeId ? `/api/forecast?store=${storeId}` : null, [storeId]);
  const sets = can('items.edit');
  const [show, setShow] = useState(start ? 'none' : 'look');
  const [edits, setEdits] = useState({});
  const [picked, setPicked] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);

  // A fresh list starts with what is worth a look already ticked, at the suggested numbers.
  useEffect(() => {
    if (!data) return;
    setEdits(Object.fromEntries(data.rows.map((r) => [r.itemId, { reorder: String(r.suggested.reorder), critical: String(r.suggested.critical), par: String(r.suggested.par) }])));
    setPicked(new Set(data.rows.filter((r) => r.differs).map((r) => r.itemId)));
    setTried(false);
  }, [data]);

  const rows = useMemo(() => (data ? data.rows.filter((r) => (show === 'look' ? r.differs : show === 'none' ? !r.now : true)) : []), [data, show]);
  const t = data?.timings;
  const set = (id, k, v) => setEdits((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  const tick = (id, on) => setPicked((p) => { const n = new Set(p); if (on) n.add(id); else n.delete(id); return n; });
  const accept = async () => {
    if (!picked.size) { setTried(true); return; }
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/forecast/accept', { storeId, rows: [...picked].map((itemId) => ({ itemId, ...edits[itemId] })) });
      toast(`Levels set for ${r.set} item${r.set === 1 ? '' : 's'}`);
      refreshStock(); reload();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  const level = (r, k, label) => (sets
    ? <QtyInput value={edits[r.itemId]?.[k] ?? ''} onChange={(v) => set(r.itemId, k, v)} label={`${label}: ${r.name}`} style={{ maxWidth: 96 }} />
    : <b>{fmtQty(r.suggested[k])}</b>);

  return (
    <>
      <Card>
        <Field label="For store"><Select value={storeId} onChange={(v) => { setStoreId(v); setShow('look'); }} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        {data && (
          <p className="muted">
            Worked out from what left {data.store.name} in the last 30 and 90 days.{' '}
            {data.store.kind === 'MAIN'
              ? `An order takes the supplier's usual delivery time, or ${days(t.leadDays)} when the supplier has none;`
              : `Restocking from the main store takes ${days(t.restockDays)};`}{' '}
            {days(t.safetyDays)} of use are kept to spare, and one order lasts {days(t.coverDays)}. These are set under Admin, Settings.
          </p>
        )}
      </Card>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <>
          {data.rows.length > 0 && (
            <Segmented label="Show" value={show} onChange={setShow} options={[
              { value: 'look', label: 'Worth a look', n: data.toLook }, { value: 'none', label: 'No levels yet', n: data.noLevels }, { value: 'all', label: 'All used', n: data.rows.length },
            ]} />
          )}
          <Card pad={false}>
            <Table caption="Suggested levels" rows={rows} rowKey={(r) => r.itemId}
              empty={!data.rows.length ? `Nothing was used from ${data.store.name} in the last 90 days.` : show === 'look' ? 'Every suggestion is close to what is set now.' : 'Every item used here has levels.'}
              columns={[
                ...(sets ? [{ key: 'use', label: 'Set', sortable: false, width: '72px', render: (r) => <Check checked={picked.has(r.itemId)} onChange={(on) => tick(r.itemId, on)} aria-label={`Set the levels for ${r.name}`}><span className="sr">Set</span></Check> }] : []),
                { key: 'name', label: 'Item', primary: true, width: 'minmax(0, 2.4fr)', render: (r) => (
                  <span className="min0">
                    <span className="row-label">{r.name} {r.littleHistory && <Pill tone="warn">Little history</Pill>}</span>
                    <span className="row-sub">Used {fmtQty(r.used30)} {r.uom} in 30 days, {fmtQty(r.used90)} in {r.daysKnown < 90 ? `the ${r.daysKnown} days it has been here` : '90'}. {r.leadFrom === 'supplier' ? `${r.supplierName} delivers in ${days(r.leadDays)}.` : ''}</span>
                  </span>
                ) },
                { key: 'now', label: 'Set now', sortable: false, render: (r) => (r.now ? `Reorder at ${fmtQty(r.now.reorder)}, critical at ${fmtQty(r.now.critical)}, top up to ${fmtQty(r.now.par)}` : 'None') },
                { key: 'reorder', label: 'Reorder at', align: 'right', sortable: false, render: (r) => level(r, 'reorder', 'Reorder at') },
                { key: 'critical', label: 'Critical at', align: 'right', sortable: false, render: (r) => level(r, 'critical', 'Critical at') },
                { key: 'par', label: 'Top up to', align: 'right', sortable: false, render: (r) => level(r, 'par', 'Top up to') },
              ]} />
          </Card>
          {data.unusedWithLevels > 0 && <Quiet icon="info">{data.unusedWithLevels} item{data.unusedWithLevels === 1 ? ' has' : 's have'} levels here but {data.unusedWithLevels === 1 ? 'was' : 'were'} not used in 90 days. Their levels are left as they are.</Quiet>}
          {sets && data.rows.length > 0 && (
            <>
              {tried && !picked.size && <Note tone="warn" icon="alert" role="alert">Still needed: tick at least one item to set.</Note>}
              <ErrorNote error={err} />
              <div className="inv-submit"><Button busy={busy} icon="check" onClick={accept}>{picked.size ? `Set levels for ${picked.size} item${picked.size === 1 ? '' : 's'}` : 'Set levels'}</Button></div>
            </>
          )}
          {!sets && data.rows.length > 0 && <Quiet icon="info">A manager sets these levels.</Quiet>}
        </>
      )}
    </>
  );
}

/** For What to buy: items used lately with no levels cannot be suggested, so say how many. */
export function MissingLevels({ storeId, onOpen }) {
  const { data } = useData(storeId ? `/api/forecast?store=${storeId}` : null, [storeId]);
  if (!data?.noLevels) return null;
  return (
    <Note icon="info">
      {data.noLevels} item{data.noLevels === 1 ? '' : 's'} used here in the last 90 days {data.noLevels === 1 ? 'has' : 'have'} no reorder level, so What to buy cannot suggest {data.noLevels === 1 ? 'it' : 'them'}.{' '}
      <button type="button" className="link" onClick={() => onOpen(storeId)}>See suggested levels</button>
    </Note>
  );
}
