/**
 * In use: opened kits, vials and reagents, each at its bench or analyser, soonest due first.
 * Opening one takes it off the shelf as a use; it is then followed until it is finished or
 * thrown away. Past packs are found by lot number, which is how a lot is traced to where it went.
 *
 * Only shown when the unit has switched on opened packs (Admin, Settings).
 */

import { useEffect, useMemo, useState } from 'react';
import { fmtDate, fmtDateTime, fmtQty, get, post } from '../api.js';
import {
  Button, Card, ErrorNote, Field, ItemPicker, Loading, Note, Page, Pill, Quiet, SearchBox, Segmented, Select, Sheet, Stepper, Table, useApp, useData,
} from '../ui.jsx';
import { useMyStores } from './Record.jsx';
import { t } from '../i18n.js';

export const STORAGE = { ROOM: 'Room temperature', FRIDGE: 'Fridge, 2 to 8 °C', FREEZER: 'Freezer' };
const STANDING = { PAST: ['danger', 'Past its date'], DUE: ['warn', 'Due soon'], OK: ['ok', 'In date'], NO_DATE: ['plain', 'No date'] };

export default function InUse() {
  const { can } = useApp();
  const [show, setShow] = useState('open');
  const [q, setQ] = useState('');
  const [opening, setOpening] = useState(false);
  const path = show === 'open' ? '/api/openings' : `/api/openings?closed=1${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`;
  const { data, error, loading, reload } = useData(path, [path]);
  return (
    <Page title="In use" subtitle="Opened kits, vials and reagents, where each is in use and when it must be finished by."
      actions={can('stock.use') && <Button icon="plus" onClick={() => setOpening(true)}>Open a pack</Button>}>
      <Segmented label="Show" value={show} onChange={setShow} options={[{ value: 'open', label: 'Open now' }, { value: 'closed', label: 'Finished and thrown away' }]} />
      {show === 'closed' && <SearchBox value={q} onChange={setQ} placeholder="Find a lot number or an item" />}
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (show === 'open' ? <OpenList rows={data} reload={reload} /> : <ClosedList rows={data} />)}
      {opening && <OpenSheet onClose={() => setOpening(false)} onDone={() => { setOpening(false); reload(); }} />}
    </Page>
  );
}

const what = (o) => (
  <span className="min0">
    <span className="row-label">{o.name}</span>
    <span className="row-sub">{[o.batch_no ? t('Lot {lot}', { lot: o.batch_no }) : t('No lot number'), o.qty !== 1 && `${fmtQty(o.qty)} ${t(o.uom)}`, o.storage && t(STORAGE[o.storage])].filter(Boolean).join(' · ')}</span>
  </span>
);
const where = (o) => <span className="min0"><span>{o.area_name || t('No area')}</span>{o.department_name && <span className="row-sub">{o.department_name}</span>}</span>;

function OpenList({ rows, reload }) {
  const { can, toast } = useApp();
  const [acting, setActing] = useState(null);
  if (!rows.length) return <Card><Quiet>Nothing is open at the moment.</Quiet></Card>;
  const mayClose = (o) => o.mine || can('adjust.raise');
  return (
    <>
      <Card pad={false}>
        <Table caption="Open now" rows={rows} onRow={(o) => (mayClose(o) ? setActing(o) : undefined)} columns={[
          { key: 'name', label: 'Pack', primary: true, width: 'minmax(0, 2fr)', render: what },
          { key: 'area_name', label: 'In use at', render: where },
          { key: 'opened_at', label: 'Opened', render: (o) => <span className="min0"><span>{fmtDate(o.opened_at)}</span><span className="row-sub">{o.opened_by_name}</span></span> },
          { key: 'use_by', label: 'Use by', sort: (o) => o.use_by || '9999', render: (o) => <span className="row">{o.use_by ? fmtDate(o.use_by) : ''} <Pill tone={STANDING[o.standing][0]}>{STANDING[o.standing][1]}</Pill></span> },
        ]} />
      </Card>
      <Quiet icon="info">Choose a pack to mark it finished, or thrown away.</Quiet>
      {acting && <CloseSheet o={acting} onClose={() => setActing(null)} onDone={(msg) => { setActing(null); toast(msg); reload(); }} />}
    </>
  );
}

function ClosedList({ rows }) {
  if (!rows.length) return <Card><Quiet>Nothing found.</Quiet></Card>;
  return (
    <Card pad={false}>
      <Table caption="Finished and thrown away" rows={rows} columns={[
        { key: 'name', label: 'Pack', primary: true, width: 'minmax(0, 2fr)', render: what },
        { key: 'area_name', label: 'Used at', render: where },
        { key: 'opened_at', label: 'Opened', render: (o) => fmtDate(o.opened_at) },
        { key: 'status', label: 'Ended', render: (o) => (
          <span className="min0">
            <Pill tone={o.status === 'FINISHED' ? 'ok' : 'warn'}>{o.status === 'FINISHED' ? 'Finished' : 'Thrown away'}</Pill>
            <span className="row-sub">{fmtDateTime(o.closed_at)}, {o.closed_by_name}{o.close_reason ? `. ${o.close_reason}` : ''}</span>
          </span>
        ) },
      ]} />
    </Card>
  );
}

function CloseSheet({ o, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const act = async (action) => {
    setBusy(true); setErr(null);
    try {
      await post(`/api/openings/${o.id}/${action}`, { reason });
      onDone(action === 'finish' ? t('{name} marked finished', { name: o.name }) : t('{name} marked thrown away', { name: o.name }));
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={o.name} onClose={onClose}
      footer={<><Button kind="secondary" busy={busy} onClick={() => act('discard')}>Thrown away</Button><Button busy={busy} icon="check" onClick={() => act('finish')}>Finished</Button></>}>
      <p className="muted">{[o.batch_no ? t('Lot {lot}', { lot: o.batch_no }) : t('No lot number'), t('opened {date} by {name}', { date: fmtDateTime(o.opened_at), name: o.opened_by_name }), o.area_name && t('at {area}', { area: o.area_name }), o.use_by && t('use by {date}', { date: fmtDate(o.use_by) })].filter(Boolean).join(', ')}.</p>
      <Field label="Why it is thrown away (needed only for that)" hint="Past its date, contaminated, failed quality control."><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} /></Field>
      <ErrorNote error={err} />
    </Sheet>
  );
}

function OpenSheet({ onClose, onDone }) {
  const { me, can, stock, lists, toast, refreshStock, refreshBadges } = useApp();
  const stores = useMyStores();
  const mode = me.settings['consumption.record'] || 'both';
  const needPerson = mode !== 'room';
  const forOthers = can('use.for_others');
  const { data: people } = useData(needPerson && forOthers ? '/api/people/pick' : null);
  const [chosenStore, setStoreId] = useState('');
  const storeId = chosenStore || stores[0]?.id || '';
  const [item, setItem] = useState(null);
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [personId, setPersonId] = useState('');
  const [qty, setQty] = useState('1');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => {
    setBatchId('');
    if (!item?.tracksExpiry || !storeId) { setBatches([]); return; }
    get(`/api/batches?store=${storeId}&item=${item.id}`).then(setBatches).catch(() => setBatches([]));
  }, [item, storeId]);
  const here = useMemo(() => item?.stores?.find((s) => s.storeId === storeId), [item, storeId]);
  if (!stock) return null;
  const missing = [...(!item ? [t('the item')] : []), ...(!areaId ? [t('the bench or analyser')] : []), ...(!(Number(qty) > 0) ? [t('how many packs')] : [])];
  const save = async () => {
    if (missing.length) { setTried(true); return; }
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/openings', { storeId, itemId: item.id, batchId: batchId || null, areaId, personId: personId || (needPerson ? me.staffId : null), qty: Number(qty) });
      const dates = r.openings.map((o) => o.useBy).filter(Boolean);
      toast(dates.length ? t('{name} opened, use by {date}', { name: item.name, date: fmtDate(dates.sort()[0]) }) : t('{name} opened', { name: item.name }));
      refreshStock(); refreshBadges(); onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title="Open a pack" onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} icon="check" onClick={save}>Open it</Button></>}>
      <div className="form two">
        <Field label="Taken from"><Select value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Bench or analyser" hint="Where it is in use. Benches and analysers are added under Admin, Rooms and areas." error={tried && !areaId ? 'Choose where it is in use.' : undefined}>
          <Select value={areaId} onChange={setAreaId} placeholder="Choose" options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} />
        </Field>
      </div>
      {item
        ? (
          <div className="inv-line inv-line--first">
            <div className="inv-line__top">
              <div className="min0 grow">
                <span className="row-label">{item.name}</span>
                <span className="row-sub">{[here && t('{qty} {uom} here', { qty: fmtQty(here.qty), uom: t(item.uom) }), item.storage && t(STORAGE[item.storage]), item.openLifeDays && t('usable {n} days once opened', { n: item.openLifeDays })].filter(Boolean).join(' · ')}</span>
              </div>
              <Button kind="ghost" onClick={() => setItem(null)}>Change</Button>
            </div>
          </div>
        )
        : <ItemPicker label="Item" showLabel items={stock.items} storeId={storeId} onPick={setItem} filter={(i) => !i.isLinen} placeholder="Type a name or a code" />}
      <div className="form two">
        {batches.length > 0 && (
          <Field label="Lot" hint="Left as it is, the lot that expires first is opened. Expired lots are never opened.">
            <Select value={batchId} onChange={setBatchId} placeholder="The one that expires first" options={batches.map((b) => ({ value: b.id, label: `${b.batch_no || t('No lot number')} · ${b.expiry ? t('expires {date}', { date: fmtDate(b.expiry) }) : t('no date')} · ${t('{n} left', { n: fmtQty(b.qty) })}` }))} />
          </Field>
        )}
        <Field label="Packs opened"><Stepper value={qty} onChange={setQty} min={1} unit={t(item?.uom)} label="Packs opened" /></Field>
        {needPerson && forOthers && (
          <Field label="Opened by" hint="Left as it is, it is recorded under your name.">
            <Select value={personId} onChange={setPersonId} placeholder={t('{name} (you)', { name: me.name })} options={(people || []).map((p) => ({ value: p.id, label: p.name }))} />
          </Field>
        )}
      </div>
      {tried && missing.length > 0 && <Note tone="warn" icon="alert" role="alert">{t('Still needed: {what}.', { what: missing.join(', ') })}</Note>}
      <ErrorNote error={err} />
    </Sheet>
  );
}
