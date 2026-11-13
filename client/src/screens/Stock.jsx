/**
 * Stock: every item, every store, at a glance — and an item's full story one tap away.
 */

import { useMemo, useState } from 'react';
import { downloadCsv, fmtDate, fmtDateTime, fmtMoney, fmtQty, post, put } from '../api.js';
import Icon from '../icons.jsx';
import {
  Button, Card, Check, ErrorNote, Field, Loading, Note, Page, Pill, QtyInput, SearchBox, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';
import { ItemPrices, priceViewer } from './Suppliers.jsx';
import { STORAGE } from './InUse.jsx';
import { t, tn } from '../i18n.js';

const KIND = {
  RECEIPT: 'Received', ISSUE: 'Used', TRANSFER_OUT: 'Sent', TRANSFER_IN: 'Arrived', ADJUST: 'Correction',
  COUNT: 'Count', OPENING: 'Opening', LINEN: 'Linen', TAKE: 'Taken', RETURN: 'Returned',
  RELEASE: 'Released after inspection', SUPPLIER_RETURN: 'Sent back to the supplier',
};
const STATE = { available: 'shelf', in_use: 'rooms', in_wash: 'laundry', gone: 'discarded' };

/** The pack a quantity on the shelf is shown in: the largest one for storing. */
export const storePack = (packs) => (packs || []).filter((p) => p.use !== 'BUY' && p.factor > 1).sort((a, b) => b.factor - a.factor)[0] || null;

/** "3 × Box of 12 and 4 bottle", or null when it would say nothing more than the number. */
export function inPack(qty, uom, pack) {
  if (!pack || !(qty >= pack.factor)) return null;
  const whole = Math.floor(+(qty / pack.factor).toFixed(6));
  const rest = +(qty - whole * pack.factor).toFixed(3);
  return rest
    ? t('{whole} × {pack} and {qty} {uom}', { whole, pack: pack.label, qty: fmtQty(rest), uom: t(uom) })
    : `${whole} × ${pack.label}`;
}

export default function Stock() {
  const { stock, lists, route, navigate, can, currency } = useApp();
  const [q, setQ] = useState('');
  const [storeId, setStoreId] = useState('');
  const [filter, setFilter] = useState(route.query.get('filter') || 'all');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(null);

  const cats = useMemo(() => [...new Set((stock?.items || []).map((i) => i.category))].sort(), [stock]);
  const rows = useMemo(() => {
    if (!stock) return [];
    const typed = q.trim().toLowerCase();
    return stock.items.filter((it) => {
      if (category && it.category !== category) return false;
      if (typed && !`${it.name} ${it.code} ${it.barcode || ''} ${it.category}`.toLowerCase().includes(typed)) return false;
      const st = storeId ? it.stores.find((s) => s.storeId === storeId) : null;
      if (storeId && !st?.held) return false;
      const status = st ? st.status : it.status;
      if (filter === 'short') return ['OUT', 'CRITICAL', 'LOW'].includes(status);
      if (filter === 'expiring') return it.expiry === 'SOON' || it.expiry === 'EXPIRED';
      if (filter === 'linen') return it.isLinen;
      return true;
    });
  }, [stock, q, storeId, filter, category]);

  if (!stock) return <Page title="Stock"><Loading /></Page>;
  const shortN = stock.items.filter((i) => ['OUT', 'CRITICAL', 'LOW'].includes(i.status)).length;
  const expiringN = stock.items.filter((i) => i.expiry === 'SOON' || i.expiry === 'EXPIRED').length;
  const qtyFor = (it) => (storeId ? it.stores.find((s) => s.storeId === storeId) : null);

  const columns = [
    { key: 'name', label: 'Item', primary: true, render: (it) => (
      <span className="min0"><span className="row-label">{it.name}</span><span className="row-sub"><code>{it.code}</code> · {it.category}{it.isLinen && it.category !== 'Linen' ? ` · ${t('linen')}` : ''}</span></span>
    ) },
    ...(storeId ? [] : stock.stores.map((s) => ({
      key: `s-${s.id}`, label: s.name, align: 'right', sort: (it) => it.stores.find((x) => x.storeId === s.id)?.qty ?? 0,
      render: (it) => {
        const x = it.stores.find((y) => y.storeId === s.id);
        if (!x?.held) return '';
        return <span className={x.status === 'OK' ? '' : `tone-txt-${x.status}`}>{fmtQty(x.qty)}{it.isLinen && (x.inUse || x.inWash) ? <span className="faint"> {t('+{n} out', { n: fmtQty(x.inUse + x.inWash) })}</span> : ''}</span>;
      },
    }))),
    ...(storeId ? [{ key: 'qty', label: 'On shelf', align: 'right', sort: (it) => qtyFor(it)?.qty ?? 0, render: (it) => {
      const x = qtyFor(it);
      const target = x?.level?.par || (x?.level?.reorder ? x.level.reorder * 2 : 0);
      return (
        <span style={{ display: 'grid', justifyItems: 'end' }}>
          <b>{fmtQty(x?.qty)} {t(it.uom)}</b>
          {target > 0 && <span className={`qbar ${x.status}`} style={{ width: 90 }}><span style={{ width: `${Math.min(100, (x.qty / target) * 100)}%` }} /></span>}
        </span>
      );
    } }] : []),
    // A status chip does not wrap, so its column never narrows below the chip (it ran into
    // the next column at 1024 wide).
    { key: 'status', label: 'Status', width: 'minmax(min-content, 1fr)', sort: (it) => ['OUT', 'CRITICAL', 'LOW', 'OK'].indexOf(qtyFor(it)?.status || it.status), render: (it) => <Pill status={qtyFor(it)?.status || it.status} /> },
    { key: 'nextExpiry', label: 'Next expiry', width: 'minmax(min-content, 1fr)', render: (it) => (it.nextExpiry ? <Pill status={it.expiry}>{fmtDate(it.nextExpiry)}</Pill> : '') },
    ...(can('cost.view') ? [{ key: 'value', label: 'Value', align: 'right', render: (it) => fmtMoney(it.value, currency) }] : []),
  ];

  const exportCsv = () => downloadCsv(`stock-${new Date().toISOString().slice(0, 10)}.csv`, rows, [
    { key: 'code', label: 'Code' }, { key: 'name', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'uom', label: 'Unit' },
    ...stock.stores.map((s) => ({ label: s.name, value: (it) => it.stores.find((x) => x.storeId === s.id)?.qty ?? '' })),
    { key: 'total', label: 'Total incl. linen out and stock with people' }, { key: 'status', label: 'Status' }, { key: 'nextExpiry', label: 'Next expiry' },
    ...(can('cost.view') ? [{ key: 'avgCost', label: 'Average cost' }, { key: 'value', label: 'Value' }] : []),
  ]);

  return (
    <Page title="Stock" subtitle={tn(stock.stores.length, '{items} items across {n} store', '{items} items across {n} stores', { items: stock.items.length })}
      actions={<>
        <Button kind="secondary" icon="download" onClick={exportCsv}>CSV</Button>
        {can('items.edit') && <Button icon="plus" onClick={() => setEditing({})}>New item</Button>}
      </>}>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, code or barcode" />
        <Select value={storeId} onChange={setStoreId} placeholder="All stores" options={stock.stores.map((s) => ({ value: s.id, label: s.name }))} aria-label={t('Store')} />
        <Select value={category} onChange={setCategory} placeholder="All categories" options={cats.map((c) => ({ value: c, label: c }))} aria-label={t('Category')} />
      </div>
      <Segmented label="Show" value={filter} onChange={setFilter} options={[
        { value: 'all', label: 'All', n: stock.items.length }, { value: 'short', label: 'Short', n: shortN },
        { value: 'expiring', label: 'Expiring', n: expiringN }, { value: 'linen', label: 'Linen' },
      ]} />
      <Card pad={false}>
        <Table columns={columns} rows={rows} onRow={(it) => navigate(`stock/${it.id}`)}
          empty={q || filter !== 'all' || category ? 'No item matches these filters.' : 'No items yet. An administrator can add them, or import the old app\'s list.'} />
      </Card>
      {/* One window at a time: while the item is edited, its window steps aside (Part O). */}
      {route.id && !editing && <ItemSheet id={route.id} onClose={() => navigate('stock')} onEdit={(it) => setEditing(it)} />}
      {editing && <ItemForm item={editing.id ? editing : null} stores={lists.stores} onClose={() => setEditing(null)} />}
    </Page>
  );
}

function ItemSheet({ id, onClose, onEdit }) {
  const { can, currency, navigate } = useApp();
  const { data: it, error, loading } = useData(`/api/items/${id}`);
  return (
    <Sheet wide title={it ? it.name : 'Item'} onClose={onClose}
      footer={it && <>
        {can('items.edit') && <Button kind="secondary" icon="edit" onClick={() => onEdit(it)}>Edit item</Button>}
        {can('request.create') && <Button kind="secondary" icon="requests" onClick={() => navigate(`requests?new=${it.id}`)}>Request</Button>}
        {can('stock.use') && !it.is_linen && <Button icon="use" onClick={() => navigate(`use?item=${it.id}`)}>Record use</Button>}
      </>}>
      <ErrorNote error={error} />
      {loading && <Loading />}
      {it && (
        <>
          <p className="muted"><code>{it.code}</code> · {it.category} · {t('counted in {uom}', { uom: t(it.uom) })}{it.barcode ? <> · {t('barcode')} <code>{it.barcode}</code></> : ''}{it.supplier ? ` · ${t('usual supplier {name}', { name: it.supplier.name })}` : ''}{it.storage ? ` · ${STORAGE[it.storage] ? t(STORAGE[it.storage]) : it.storage}` : ''}{it.open_life_days ? ` · ${t('usable {n} days once opened', { n: it.open_life_days })}` : ''}</p>
          {!it.active && <Note tone="warn" icon="alert">This item has been retired. It stays in the records but cannot be used or ordered.</Note>}
          {it.packs?.length > 0 && <p className="muted">{t('Packs: {list}', { list: it.packs.map((p) => `${p.label} (${fmtQty(p.factor)} ${t(it.uom)}${p.supplierName ? `, ${p.supplierName}` : ''})`).join(' · ') })}</p>}
          <dl className="hf-kv hf-kv--3">
            {it.balances.map((b) => {
              const place = it.locations?.find((l) => l.store_id === b.store_id)?.location;
              const shown = inPack(b.qty, it.uom, storePack(it.packs));
              return (
                <div key={b.store_id}><dt>{b.store_name}</dt><dd>{fmtQty(b.qty)} {t(it.uom)}</dd>
                  {shown && <span className="row-sub">{shown}</span>}
                  {b.on_hold > 0 && <span className="row-sub">{t('{qty} {uom} held for inspection', { qty: fmtQty(b.on_hold), uom: t(it.uom) })}</span>}
                  {place && <span className="row-sub">{t('Shelf {shelf}', { shelf: place })}</span>}
                  {it.is_linen ? <span className="row-sub">{t('{rooms} in rooms · {laundry} at laundry', { rooms: fmtQty(b.in_use), laundry: fmtQty(b.in_wash) })}</span> : null}
                </div>
              );
            })}
            {it.with_people > 0 && <div><dt>{t('With people')}</dt><dd>{fmtQty(it.with_people)} {t(it.uom)}</dd><span className="row-sub">{t('Taken, not yet used or returned')}</span></div>}
            <div><dt>{t('Used, last 30 days')}</dt><dd>{fmtQty(it.used30)} {t(it.uom)}</dd></div>
            {can('cost.view') && <div><dt>{t('Average cost')}</dt><dd>{fmtMoney(it.avg_cost, currency)}</dd></div>}
          </dl>
          {it.levels.length > 0 && (
            <Card title="Levels" hint="Low at the reorder level, red at the critical level, and topped up to par when replenished or ordered.">
              <Table columns={[
                { key: 'store_name', label: 'Store', primary: true },
                { key: 'reorder', label: 'Reorder at', align: 'right', render: (l) => fmtQty(l.reorder) },
                { key: 'critical', label: 'Critical at', align: 'right', render: (l) => fmtQty(l.critical) },
                { key: 'par', label: 'Top up to', align: 'right', render: (l) => fmtQty(l.par) },
              ]} rows={it.levels} rowKey={(l) => l.store_id} />
            </Card>
          )}
          {it.tracks_expiry ? (
            <Card title="Batches" hint="Issued first-expiry-first. A batch with no date is shown last and is worth checking.">
              <Table columns={[
                { key: 'store_name', label: 'Store', primary: true },
                { key: 'batch_no', label: 'Lot', render: (b) => b.batch_no || '' },
                { key: 'expiry', label: 'Expiry', render: (b) => (b.expiry ? fmtDate(b.expiry) : <Pill status="UNKNOWN" />) },
                { key: 'qty', label: 'Qty', align: 'right', render: (b) => fmtQty(b.qty) },
              ]} rows={it.batches} empty="No batches in stock." />
            </Card>
          ) : null}
          {priceViewer(can) && <ItemPrices id={id} />}
          <Card title="Recent movements" pad={false}>
            <Table columns={[
              { key: 'at', label: 'When', render: (m) => <span className="nowrap">{fmtDateTime(m.at)}</span> },
              { key: 'kind', label: 'What', primary: true, render: (m) => (
                <span className="min0"><span className="row-label">{t(KIND[m.kind]) || m.kind}{m.kind === 'LINEN' ? `: ${t(STATE[m.from_state])} → ${t(STATE[m.to_state])}` : ''}</span>
                  <span className="row-sub">{[m.store_name, m.area_name, m.counterpart_name && (m.qty < 0 ? t('to {name}', { name: m.counterpart_name }) : t('from {name}', { name: m.counterpart_name })), m.doc_ref, m.reason, m.batch_no && t('lot {lot}', { lot: m.batch_no })].filter(Boolean).join(' · ')}</span></span>
              ) },
              { key: 'qty', label: 'Qty', align: 'right', render: (m) => <b>{m.kind === 'LINEN' ? fmtQty(m.qty) : `${m.qty > 0 ? '+' : ''}${fmtQty(m.qty)}`}</b> },
              { key: 'balance_after', label: 'After', align: 'right', render: (m) => fmtQty(m.balance_after) },
              { key: 'actor_name', label: 'By' },
            ]} rows={it.movements} empty="Nothing has moved yet." />
          </Card>
        </>
      )}
    </Sheet>
  );
}

/** Create or edit an item, with its levels in every store. Exported for Admin. */
export function ItemForm({ item, stores, onClose, onSaved }) {
  const { refreshStock, toast, currency, can, stock, me } = useApp();
  const lab = me.settings?.['lots.opened'] === 'on';
  const packsOn = me.settings?.['packs.on'] === 'on';
  const placesOn = me.settings?.['locations.on'] === 'on';
  const inspectOn = me.settings?.['quarantine.on'] === 'flagged';
  const { data: suppliers } = useData('/api/suppliers');
  const cats = [...new Set((stock?.items || []).map((i) => i.category))].sort();
  const levelOf = (sid) => item?.levels?.find((l) => l.store_id === sid) || item?.stores?.find((s) => s.storeId === sid)?.level || {};
  const placeOf = (sid) => item?.locations?.find((l) => l.store_id === sid)?.location ?? item?.stores?.find((s) => s.storeId === sid)?.location ?? '';
  const [f, setF] = useState({
    code: item?.code || '', name: item?.name || '', category: item?.category || '', uom: item?.uom || 'pcs', barcode: item?.barcode || '',
    tracksExpiry: !!(item?.tracks_expiry ?? item?.tracksExpiry), isLinen: !!(item?.is_linen ?? item?.isLinen),
    supplierId: item?.supplier_id ?? item?.supplierId ?? '', notes: item?.notes || '', active: item ? !!item.active : true, unitCost: '',
    storage: item?.storage || '', openLifeDays: item?.open_life_days ?? item?.openLifeDays ?? '',
    inspect: !!(item?.inspect),
    packs: (item?.packs || []).map((p) => ({ key: p.id, label: p.label, factor: String(p.factor), supplierId: p.supplierId || '', use: p.use || 'BOTH' })),
    levels: stores.map((s) => ({ storeId: s.id, name: s.name, reorder: levelOf(s.id).reorder ?? '', critical: levelOf(s.id).critical ?? '', par: levelOf(s.id).par ?? '', location: placeOf(s.id) || '' })),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setLevel = (sid, k, v) => setF((x) => ({ ...x, levels: x.levels.map((l) => (l.storeId === sid ? { ...l, [k]: v } : l)) }));
  const setPack = (key, k, v) => setF((x) => ({ ...x, packs: x.packs.map((p) => (p.key === key ? { ...p, [k]: v } : p)) }));
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const { storage, openLifeDays, packs, inspect, ...rest } = f;
      // Each feature's fields go only where the unit uses it, so a form without them never clears them.
      const body = {
        ...rest, ...(lab ? { storage, openLifeDays } : {}), ...(inspectOn ? { inspect } : {}),
        ...(packsOn ? { packs: packs.filter((p) => p.label.trim() || p.factor).map((p) => ({ label: p.label, factor: Number(p.factor), supplierId: p.supplierId || null, use: p.use })) } : {}),
        supplierId: f.supplierId || null,
        levels: f.levels.map((l) => ({ storeId: l.storeId, reorder: l.reorder || 0, critical: l.critical || 0, par: l.par || 0, ...(placesOn ? { location: l.location } : {}) })),
      };
      if (item?.id) await put(`/api/items/${item.id}`, body); else await post('/api/items', body);
      toast(item?.id ? 'Item saved' : 'Item added');
      await refreshStock();
      onSaved?.();
      onClose();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet wide title={item?.id ? t('Edit {name}', { name: item.name }) : 'New item'} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
      <ErrorNote error={err} />
      <datalist id="cat-list">{cats.map((c) => <option key={c} value={c} />)}</datalist>
      <div className="form two">
        <Field label="Name"><input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Dhanwantharam thailam 450 ml" /></Field>
        <Field label="Code" hint="Short and unique in this unit. Letters, numbers, dash."><input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="OIL-DHAN-450" /></Field>
        <Field label="Category"><input value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Oils" list="cat-list" /></Field>
        <Field label="Counted in" hint="The unit people count and use: bottle, box, kg, pcs."><input value={f.uom} onChange={(e) => set('uom', e.target.value)} /></Field>
        <Field label="Barcode"><input value={f.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder={t('Optional: scan into this box')} /></Field>
        <Field label="Usual supplier"><Select value={f.supplierId} onChange={(v) => set('supplierId', v)} placeholder="None" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
        {!item?.id && can('cost.view') && <Field label={t('Starting cost ({currency})', { currency })} hint="Optional. Receipts set the average cost from then on."><QtyInput value={f.unitCost} onChange={(v) => set('unitCost', v)} label="Starting cost" /></Field>}
        <div className="span2 stack" style={{ gap: 6 }}>
          <Check checked={f.tracksExpiry} onChange={(v) => set('tracksExpiry', v)}>{t('Track batches and expiry dates')}<span className="muted">: {t('oils, medicines, creams')}</span></Check>
          <Check checked={f.isLinen} onChange={(v) => set('isLinen', v)}>{t('This is linen')}<span className="muted">: {t('towels and sheets go to rooms and the laundry and come back')}</span></Check>
          {item?.id && <Check checked={!f.active} onChange={(v) => set('active', !v)}>{t('Retire this item')}<span className="muted">: {t('it stays in the records but cannot be used or ordered')}</span></Check>}
        </div>
        {lab && (
          <>
            <Field label="Kept in (optional)"><Select value={f.storage} onChange={(v) => set('storage', v)} placeholder="Not said" options={Object.entries(STORAGE).map(([value, label]) => ({ value, label }))} /></Field>
            <Field label="Days usable once opened (optional)" hint={`An opened pack's in-use date is this many days after opening, or its printed expiry if that comes first.`}>
              <input type="number" min="1" max="3650" inputMode="numeric" value={f.openLifeDays} onChange={(e) => set('openLifeDays', e.target.value)} />
            </Field>
          </>
        )}
        {inspectOn && (
          <div className="span2"><Check checked={f.inspect} onChange={(v) => set('inspect', v)}>{t('Inspect on arrival')} <span className="muted">: {t('a delivery of it is held as not usable until somebody checks and releases it')}</span></Check></div>
        )}
        <Field label="Notes" className="span2"><textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      </div>
      {packsOn && (
        <Card title="Pack sizes" hint={t('How it is bought or stored, in {uom}. Stock is always kept in {uom}; a pack is a way of writing it on an order or a delivery.', { uom: f.uom ? t(f.uom) : t('its own unit') })}>
          <div className="stack">
            {f.packs.length === 0 && <p className="muted">{t('No pack sizes. It is bought and stored in {uom}.', { uom: f.uom ? t(f.uom) : t('its own unit') })}</p>}
            {f.packs.map((p) => (
              <div key={p.key} className="line" style={{ gridTemplateColumns: '1fr' }}>
                <div className="line-fields">
                  <Field label="Pack"><input value={p.label} onChange={(e) => setPack(p.key, 'label', e.target.value)} placeholder="Carton of 48" maxLength={40} /></Field>
                  <Field label={t('{uom} in one', { uom: t(f.uom || 'pcs') })}><QtyInput value={p.factor} onChange={(v) => setPack(p.key, 'factor', v)} label={t('How many {uom} in {pack}', { uom: t(f.uom), pack: p.label || t('this pack') })} /></Field>
                  <Field label="Supplier"><Select value={p.supplierId} onChange={(v) => setPack(p.key, 'supplierId', v)} placeholder="Any supplier" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
                  <Field label="Used for"><Select value={p.use} onChange={(v) => setPack(p.key, 'use', v)} options={[{ value: 'BOTH', label: 'Buying and storing' }, { value: 'BUY', label: 'Buying only' }, { value: 'STORE', label: 'Storing only' }]} /></Field>
                  <Button kind="ghost" icon="close" onClick={() => set('packs', f.packs.filter((x) => x.key !== p.key))}>Remove</Button>
                </div>
              </div>
            ))}
            <div><Button kind="secondary" icon="plus" onClick={() => set('packs', [...f.packs, { key: Math.random().toString(36).slice(2), label: '', factor: '', supplierId: '', use: 'BOTH' }])}>Add a pack size</Button></div>
          </div>
        </Card>
      )}
      <Card title="Levels per store" hint="Leave a store at zero if the item is not kept there.">
        <div className="stack">
          {f.levels.map((l) => (
            <div key={l.storeId} className="line" style={{ gridTemplateColumns: '1fr' }}>
              <div className="line-name">{l.name}</div>
              <div className="line-fields">
                <Field label="Reorder at"><QtyInput value={l.reorder} onChange={(v) => setLevel(l.storeId, 'reorder', v)} label={t('Reorder at, {store}', { store: l.name })} /></Field>
                <Field label="Critical at"><QtyInput value={l.critical} onChange={(v) => setLevel(l.storeId, 'critical', v)} label={t('Critical at, {store}', { store: l.name })} /></Field>
                <Field label="Top up to"><QtyInput value={l.par} onChange={(v) => setLevel(l.storeId, 'par', v)} label={t('Top up to, {store}', { store: l.name })} /></Field>
                {placesOn && <Field label="Shelf location"><input value={l.location} onChange={(e) => setLevel(l.storeId, 'location', e.target.value)} placeholder="A-3-2" maxLength={40} aria-label={t('Shelf location, {store}', { store: l.name })} /></Field>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Sheet>
  );
}
