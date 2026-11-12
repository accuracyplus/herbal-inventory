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

const KIND = {
  RECEIPT: 'Received', ISSUE: 'Used', TRANSFER_OUT: 'Sent', TRANSFER_IN: 'Arrived', ADJUST: 'Correction',
  COUNT: 'Count', OPENING: 'Opening', LINEN: 'Linen', TAKE: 'Taken', RETURN: 'Returned',
};
const STATE = { available: 'shelf', in_use: 'rooms', in_wash: 'laundry', gone: 'discarded' };

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
    const t = q.trim().toLowerCase();
    return stock.items.filter((it) => {
      if (category && it.category !== category) return false;
      if (t && !`${it.name} ${it.code} ${it.barcode || ''} ${it.category}`.toLowerCase().includes(t)) return false;
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
      <span className="min0"><span className="row-label">{it.name}</span><span className="row-sub"><code>{it.code}</code> · {it.category}{it.isLinen && it.category !== 'Linen' ? ' · linen' : ''}</span></span>
    ) },
    ...(storeId ? [] : stock.stores.map((s) => ({
      key: `s-${s.id}`, label: s.name, align: 'right', sort: (it) => it.stores.find((x) => x.storeId === s.id)?.qty ?? 0,
      render: (it) => {
        const x = it.stores.find((y) => y.storeId === s.id);
        if (!x?.held) return '';
        return <span className={x.status === 'OK' ? '' : `tone-txt-${x.status}`}>{fmtQty(x.qty)}{it.isLinen && (x.inUse || x.inWash) ? <span className="faint"> +{fmtQty(x.inUse + x.inWash)} out</span> : ''}</span>;
      },
    }))),
    ...(storeId ? [{ key: 'qty', label: 'On shelf', align: 'right', sort: (it) => qtyFor(it)?.qty ?? 0, render: (it) => {
      const x = qtyFor(it);
      const target = x?.level?.par || (x?.level?.reorder ? x.level.reorder * 2 : 0);
      return (
        <span style={{ display: 'grid', justifyItems: 'end' }}>
          <b>{fmtQty(x?.qty)} {it.uom}</b>
          {target > 0 && <span className={`qbar ${x.status}`} style={{ width: 90 }}><span style={{ width: `${Math.min(100, (x.qty / target) * 100)}%` }} /></span>}
        </span>
      );
    } }] : []),
    { key: 'status', label: 'Status', sort: (it) => ['OUT', 'CRITICAL', 'LOW', 'OK'].indexOf(qtyFor(it)?.status || it.status), render: (it) => <Pill status={qtyFor(it)?.status || it.status} /> },
    { key: 'nextExpiry', label: 'Next expiry', render: (it) => (it.nextExpiry ? <Pill status={it.expiry}>{fmtDate(it.nextExpiry)}</Pill> : '') },
    ...(can('cost.view') ? [{ key: 'value', label: 'Value', align: 'right', render: (it) => fmtMoney(it.value, currency) }] : []),
  ];

  const exportCsv = () => downloadCsv(`stock-${new Date().toISOString().slice(0, 10)}.csv`, rows, [
    { key: 'code', label: 'Code' }, { key: 'name', label: 'Item' }, { key: 'category', label: 'Category' }, { key: 'uom', label: 'Unit' },
    ...stock.stores.map((s) => ({ label: s.name, value: (it) => it.stores.find((x) => x.storeId === s.id)?.qty ?? '' })),
    { key: 'total', label: 'Total incl. linen out and stock with people' }, { key: 'status', label: 'Status' }, { key: 'nextExpiry', label: 'Next expiry' },
    ...(can('cost.view') ? [{ key: 'avgCost', label: 'Average cost' }, { key: 'value', label: 'Value' }] : []),
  ]);

  return (
    <Page title="Stock" subtitle={`${stock.items.length} items across ${stock.stores.length} store${stock.stores.length === 1 ? '' : 's'}`}
      actions={<>
        <Button kind="secondary" icon="download" onClick={exportCsv}>CSV</Button>
        {can('items.edit') && <Button icon="plus" onClick={() => setEditing({})}>New item</Button>}
      </>}>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, code or barcode" />
        <Select value={storeId} onChange={setStoreId} placeholder="All stores" options={stock.stores.map((s) => ({ value: s.id, label: s.name }))} aria-label="Store" />
        <Select value={category} onChange={setCategory} placeholder="All categories" options={cats.map((c) => ({ value: c, label: c }))} aria-label="Category" />
      </div>
      <Segmented label="Show" value={filter} onChange={setFilter} options={[
        { value: 'all', label: 'All', n: stock.items.length }, { value: 'short', label: 'Short', n: shortN },
        { value: 'expiring', label: 'Expiring', n: expiringN }, { value: 'linen', label: 'Linen' },
      ]} />
      <Card pad={false}>
        <Table columns={columns} rows={rows} onRow={(it) => navigate(`stock/${it.id}`)}
          empty={q || filter !== 'all' || category ? 'No item matches these filters.' : 'No items yet. An administrator can add them, or import the old app\'s list.'} />
      </Card>
      {route.id && <ItemSheet id={route.id} onClose={() => navigate('stock')} onEdit={(it) => setEditing(it)} />}
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
          <p className="muted"><code>{it.code}</code> · {it.category} · counted in {it.uom}{it.barcode ? <> · barcode <code>{it.barcode}</code></> : ''}{it.supplier ? ` · usual supplier ${it.supplier.name}` : ''}{it.storage ? ` · ${STORAGE[it.storage] || it.storage}` : ''}{it.open_life_days ? ` · usable ${it.open_life_days} days once opened` : ''}</p>
          {!it.active && <Note tone="warn" icon="alert">This item has been retired. It stays in the records but cannot be used or ordered.</Note>}
          <dl className="hf-kv hf-kv--3">
            {it.balances.map((b) => (
              <div key={b.store_id}><dt>{b.store_name}</dt><dd>{fmtQty(b.qty)} {it.uom}</dd>
                {it.is_linen ? <span className="row-sub">{fmtQty(b.in_use)} in rooms · {fmtQty(b.in_wash)} at laundry</span> : null}
              </div>
            ))}
            {it.with_people > 0 && <div><dt>With people</dt><dd>{fmtQty(it.with_people)} {it.uom}</dd><span className="row-sub">Taken, not yet used or returned</span></div>}
            <div><dt>Used, last 30 days</dt><dd>{fmtQty(it.used30)} {it.uom}</dd></div>
            {can('cost.view') && <div><dt>Average cost</dt><dd>{fmtMoney(it.avg_cost, currency)}</dd></div>}
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
                <span className="min0"><span className="row-label">{KIND[m.kind] || m.kind}{m.kind === 'LINEN' ? `: ${STATE[m.from_state]} → ${STATE[m.to_state]}` : ''}</span>
                  <span className="row-sub">{[m.store_name, m.area_name, m.counterpart_name && (m.qty < 0 ? `to ${m.counterpart_name}` : `from ${m.counterpart_name}`), m.doc_ref, m.reason, m.batch_no && `lot ${m.batch_no}`].filter(Boolean).join(' · ')}</span></span>
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
  const { data: suppliers } = useData('/api/suppliers');
  const cats = [...new Set((stock?.items || []).map((i) => i.category))].sort();
  const levelOf = (sid) => item?.levels?.find((l) => l.store_id === sid) || item?.stores?.find((s) => s.storeId === sid)?.level || {};
  const [f, setF] = useState({
    code: item?.code || '', name: item?.name || '', category: item?.category || '', uom: item?.uom || 'pcs', barcode: item?.barcode || '',
    tracksExpiry: !!(item?.tracks_expiry ?? item?.tracksExpiry), isLinen: !!(item?.is_linen ?? item?.isLinen),
    supplierId: item?.supplier_id ?? item?.supplierId ?? '', notes: item?.notes || '', active: item ? !!item.active : true, unitCost: '',
    storage: item?.storage || '', openLifeDays: item?.open_life_days ?? item?.openLifeDays ?? '',
    levels: stores.map((s) => ({ storeId: s.id, name: s.name, reorder: levelOf(s.id).reorder ?? '', critical: levelOf(s.id).critical ?? '', par: levelOf(s.id).par ?? '' })),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setLevel = (sid, k, v) => setF((x) => ({ ...x, levels: x.levels.map((l) => (l.storeId === sid ? { ...l, [k]: v } : l)) }));
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const { storage, openLifeDays, ...rest } = f;
      // Storage and life once opened go only where the unit uses them, so a form without them never clears them.
      const body = { ...rest, ...(lab ? { storage, openLifeDays } : {}), supplierId: f.supplierId || null, levels: f.levels.map((l) => ({ storeId: l.storeId, reorder: l.reorder || 0, critical: l.critical || 0, par: l.par || 0 })) };
      if (item?.id) await put(`/api/items/${item.id}`, body); else await post('/api/items', body);
      toast(item?.id ? 'Item saved' : 'Item added');
      await refreshStock();
      onSaved?.();
      onClose();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet wide title={item?.id ? `Edit ${item.name}` : 'New item'} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
      <ErrorNote error={err} />
      <datalist id="cat-list">{cats.map((c) => <option key={c} value={c} />)}</datalist>
      <div className="form two">
        <Field label="Name"><input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Dhanwantharam thailam 450 ml" /></Field>
        <Field label="Code" hint="Short and unique in this unit. Letters, numbers, dash."><input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="OIL-DHAN-450" /></Field>
        <Field label="Category"><input value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Oils" list="cat-list" /></Field>
        <Field label="Counted in" hint="The unit people count and use: bottle, box, kg, pcs."><input value={f.uom} onChange={(e) => set('uom', e.target.value)} /></Field>
        <Field label="Barcode"><input value={f.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="Optional — scan into this box" /></Field>
        <Field label="Usual supplier"><Select value={f.supplierId} onChange={(v) => set('supplierId', v)} placeholder="None" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
        {!item?.id && can('cost.view') && <Field label={`Starting cost (${currency})`} hint="Optional. Receipts set the average cost from then on."><QtyInput value={f.unitCost} onChange={(v) => set('unitCost', v)} label="Starting cost" /></Field>}
        <div className="span2 stack" style={{ gap: 6 }}>
          <Check checked={f.tracksExpiry} onChange={(v) => set('tracksExpiry', v)}>Track batches and expiry dates <span className="muted">— oils, medicines, creams</span></Check>
          <Check checked={f.isLinen} onChange={(v) => set('isLinen', v)}>This is linen <span className="muted">— towels and sheets go to rooms and the laundry and come back</span></Check>
          {item?.id && <Check checked={!f.active} onChange={(v) => set('active', !v)}>Retire this item <span className="muted">— it stays in the records but cannot be used or ordered</span></Check>}
        </div>
        {lab && (
          <>
            <Field label="Kept in (optional)"><Select value={f.storage} onChange={(v) => set('storage', v)} placeholder="Not said" options={Object.entries(STORAGE).map(([value, label]) => ({ value, label }))} /></Field>
            <Field label="Days usable once opened (optional)" hint="An opened pack's in-use date is this many days after opening, or its printed expiry if that comes first.">
              <input type="number" min="1" max="3650" inputMode="numeric" value={f.openLifeDays} onChange={(e) => set('openLifeDays', e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Notes" className="span2"><textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      </div>
      <Card title="Levels per store" hint="Leave a store at zero if the item is not kept there.">
        <div className="stack">
          {f.levels.map((l) => (
            <div key={l.storeId} className="line" style={{ gridTemplateColumns: '1fr' }}>
              <div className="line-name">{l.name}</div>
              <div className="line-fields">
                <Field label="Reorder at"><QtyInput value={l.reorder} onChange={(v) => setLevel(l.storeId, 'reorder', v)} label={`Reorder at, ${l.name}`} /></Field>
                <Field label="Critical at"><QtyInput value={l.critical} onChange={(v) => setLevel(l.storeId, 'critical', v)} label={`Critical at, ${l.name}`} /></Field>
                <Field label="Top up to"><QtyInput value={l.par} onChange={(v) => setLevel(l.storeId, 'par', v)} label={`Top up to, ${l.name}`} /></Field>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Sheet>
  );
}
