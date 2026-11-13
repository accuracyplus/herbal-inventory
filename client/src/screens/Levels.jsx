/**
 * Suggested levels: what each store's reorder, critical and top-up levels would be from its real
 * use, beside what is set now. A manager ticks the ones to take, changes any number first, and
 * sets them in one go. Nothing changes by itself.
 */

import { useEffect, useMemo, useState } from 'react';
import { fmtQty, post } from '../api.js';
import { Button, Card, Check, ErrorNote, Field, Loading, Note, Pill, QtyInput, Quiet, Segmented, Select, Table, useApp, useData } from '../ui.jsx';
import { t, tn } from '../i18n.js';

/** Said when drawn, so it follows the language. */
const days = (n) => tn(n, '{n} day', '{n} days');

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
  const tm = data?.timings;
  const set = (id, k, v) => setEdits((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  const tick = (id, on) => setPicked((p) => { const n = new Set(p); if (on) n.add(id); else n.delete(id); return n; });
  const accept = async () => {
    if (!picked.size) { setTried(true); return; }
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/forecast/accept', { storeId, rows: [...picked].map((itemId) => ({ itemId, ...edits[itemId] })) });
      toast(tn(r.set, 'Levels set for {n} item', 'Levels set for {n} items'));
      refreshStock(); reload();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  const level = (r, k, label) => (sets
    ? <QtyInput value={edits[r.itemId]?.[k] ?? ''} onChange={(v) => set(r.itemId, k, v)} label={`${t(label)}: ${r.name}`} style={{ maxWidth: 96 }} />
    : <b>{fmtQty(r.suggested[k])}</b>);

  return (
    <>
      <Card>
        <Field label="For store"><Select value={storeId} onChange={(v) => { setStoreId(v); setShow('look'); }} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        {data && (
          <p className="muted">
            {t('Worked out from what left {store} in the last 30 and 90 days.', { store: data.store.name })}{' '}
            {data.store.kind === 'MAIN'
              ? t("An order takes the supplier's usual delivery time, or {days} when the supplier has none;", { days: days(tm.leadDays) })
              : t('Restocking from the main store takes {days};', { days: days(tm.restockDays) })}{' '}
            {t('{days} of use are kept to spare, and one order lasts {cover}. These are set under Admin, Settings.', { days: days(tm.safetyDays), cover: days(tm.coverDays) })}
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
              empty={!data.rows.length ? t('Nothing was used from {store} in the last 90 days.', { store: data.store.name }) : show === 'look' ? 'Every suggestion is close to what is set now.' : 'Every item used here has levels.'}
              columns={[
                ...(sets ? [{ key: 'use', label: 'Set', sortable: false, width: '72px', render: (r) => <Check checked={picked.has(r.itemId)} onChange={(on) => tick(r.itemId, on)} aria-label={t('Set the levels for {name}', { name: r.name })}><span className="sr">{t('Set')}</span></Check> }] : []),
                { key: 'name', label: 'Item', primary: true, width: 'minmax(0, 2.4fr)', render: (r) => (
                  <span className="min0">
                    <span className="row-label">{r.name} {r.littleHistory && <Pill tone="warn">Little history</Pill>}</span>
                    <span className="row-sub">{r.daysKnown < 90
                      ? t('Used {used30} {uom} in 30 days, {used90} in the {n} days it has been here.', { used30: fmtQty(r.used30), uom: t(r.uom), used90: fmtQty(r.used90), n: r.daysKnown })
                      : t('Used {used30} {uom} in 30 days, {used90} in 90.', { used30: fmtQty(r.used30), uom: t(r.uom), used90: fmtQty(r.used90) })} {r.leadFrom === 'supplier' ? t('{name} delivers in {days}.', { name: r.supplierName, days: days(r.leadDays) }) : ''}</span>
                  </span>
                ) },
                { key: 'now', label: 'Set now', sortable: false, render: (r) => (r.now ? t('Reorder at {reorder}, critical at {critical}, top up to {par}', { reorder: fmtQty(r.now.reorder), critical: fmtQty(r.now.critical), par: fmtQty(r.now.par) }) : t('None')) },
                { key: 'reorder', label: 'Reorder at', align: 'right', sortable: false, render: (r) => level(r, 'reorder', 'Reorder at') },
                { key: 'critical', label: 'Critical at', align: 'right', sortable: false, render: (r) => level(r, 'critical', 'Critical at') },
                { key: 'par', label: 'Top up to', align: 'right', sortable: false, render: (r) => level(r, 'par', 'Top up to') },
              ]} />
          </Card>
          {data.unusedWithLevels > 0 && <Quiet icon="info">{tn(data.unusedWithLevels, '{n} item has levels here but was not used in 90 days. Their levels are left as they are.', '{n} items have levels here but were not used in 90 days. Their levels are left as they are.')}</Quiet>}
          {sets && data.rows.length > 0 && (
            <>
              {tried && !picked.size && <Note tone="warn" icon="alert" role="alert">Still needed: tick at least one item to set.</Note>}
              <ErrorNote error={err} />
              <div className="inv-submit"><Button busy={busy} icon="check" onClick={accept}>{picked.size ? tn(picked.size, 'Set levels for {n} item', 'Set levels for {n} items') : 'Set levels'}</Button></div>
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
      {tn(data.noLevels, '{n} item used here in the last 90 days has no reorder level, so What to buy cannot suggest it.', '{n} items used here in the last 90 days have no reorder level, so What to buy cannot suggest them.')}{' '}
      <button type="button" className="link" onClick={() => onOpen(storeId)}>{t('See suggested levels')}</button>
    </Note>
  );
}
