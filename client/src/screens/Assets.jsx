/**
 * Equipment (feature 14, `assets.on`): the register of what the unit owns and does not use up,
 * where each piece is, its warranty, and when it is next due for service.
 */

import { useState } from 'react';
import { KeyValues } from '@hifive/ui';
import { fmtDate, fmtDateTime, fmtMoney, post, put } from '../api.js';
import {
  Button, Card, Check, ErrorNote, Field, Loading, Page, Pill, QtyInput, Quiet, SearchBox, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';
import { t, tn } from '../i18n.js';

const STANDING = { PAST: ['danger', 'Service overdue'], DUE: ['warn', 'Service due soon'], OK: ['ok', 'Serviced'], NONE: ['plain', 'No service plan'] };
const today = () => new Date(Date.now() + 4 * 36e5).toISOString().slice(0, 10);

export default function Assets() {
  const { can, route, navigate } = useApp();
  const [q, setQ] = useState('');
  const show = route.query.get('show') || 'all';
  const { data, error, loading, reload } = useData(`/api/assets?show=${show}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`, [show, q]);
  const [editing, setEditing] = useState(null);
  const go = (v) => navigate(`assets${v === 'all' ? '' : `?show=${v}`}`);
  return (
    <Page title="Equipment" subtitle="What the unit owns and does not use up: where each piece is, its warranty, and when it is next due for service."
      actions={can('assets.edit') && <Button icon="plus" onClick={() => setEditing({})}>Add equipment</Button>}>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search number, name, serial or room" /></div>
      <Segmented label="Show" value={show} onChange={go} options={[{ value: 'all', label: 'In use' }, { value: 'due', label: 'Service due' }, { value: 'retired', label: 'Retired' }]} />
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.length && <Card><Quiet>{show === 'due' ? 'Nothing is due for service.' : show === 'retired' ? 'Nothing has been retired.' : 'No equipment yet.'}</Quiet></Card>}
      {data?.length > 0 && (
        <Card pad={false}>
          <Table caption="Equipment" rows={data} onRow={(a) => navigate(`assets/${a.id}${show === 'all' ? '' : `?show=${show}`}`)} columns={[
            { key: 'name', label: 'Equipment', primary: true, render: (a) => <span className="min0"><span className="row-label">{a.name}</span><span className="row-sub"><code>{a.tag}</code>{a.serial_no ? ` · ${t('serial {serial}', { serial: a.serial_no })}` : ''}{a.make ? ` · ${[a.make, a.model].filter(Boolean).join(' ')}` : ''}</span></span> },
            { key: 'area_name', label: 'Where', render: (a) => <span className="min0"><span>{a.area_name || a.location || ''}</span>{a.department_name && <span className="row-sub">{a.department_name}</span>}</span> },
            { key: 'next_service_on', label: 'Next service', sort: (a) => a.next_service_on || '9999', render: (a) => (a.next_service_on ? <span className="row">{fmtDate(a.next_service_on)} <Pill tone={STANDING[a.standing][0]}>{STANDING[a.standing][1]}</Pill></span> : '') },
            { key: 'warranty_until', label: 'Warranty', render: (a) => (a.warranty_until ? <span className="row">{fmtDate(a.warranty_until)}{a.warranty !== 'OK' && <Pill tone={a.warranty === 'ENDED' ? 'plain' : 'warn'}>{a.warranty === 'ENDED' ? 'Ended' : 'Ending soon'}</Pill>}</span> : '') },
          ]} />
        </Card>
      )}
      {route.id && <AssetSheet id={route.id} onClose={() => navigate(`assets${show === 'all' ? '' : `?show=${show}`}`)} onEdit={setEditing} onChanged={reload} />}
      {editing && <AssetForm asset={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </Page>
  );
}

function AssetSheet({ id, onClose, onEdit, onChanged }) {
  const { me, can, currency } = useApp();
  const { data: a, error, loading, reload } = useData(`/api/assets/${id}`, [id]);
  const [servicing, setServicing] = useState(false);
  // One window at a time: recording a service takes the place of this window, which comes back after.
  if (servicing && a) return <ServiceSheet asset={a} onClose={() => setServicing(false)} onDone={() => { setServicing(false); reload(); onChanged(); }} />;
  return (
    <Sheet wide title={a ? a.name : 'Equipment'} onClose={onClose}
      footer={a && can('assets.edit') && <>
        <Button kind="secondary" icon="edit" onClick={() => onEdit(a)}>Edit</Button>
        {a.status !== 'RETIRED' && <Button icon="asset" onClick={() => setServicing(true)}>Record a service</Button>}
      </>}>
      <ErrorNote error={error} />
      {loading && !a && <Loading />}
      {a && (
        <>
          <div className="row"><Pill tone={STANDING[a.standing][0]}>{STANDING[a.standing][1]}</Pill><span className="muted">{t(me.labels.assetStatus?.[a.status])}</span></div>
          <KeyValues columns={3} items={[
            { label: t('Asset number'), value: a.tag }, { label: t('Serial number'), value: a.serial_no },
            { label: t('Make and model'), value: [a.make, a.model].filter(Boolean).join(' ') },
            { label: t('Where'), value: [a.area_name || a.location, a.department_name].filter(Boolean).join(', ') },
            { label: t('Supplier'), value: a.supplier_name }, { label: t('Bought'), value: a.purchased_on && fmtDate(a.purchased_on) },
            ...(can('cost.view') ? [{ label: t('Cost'), value: a.cost != null ? fmtMoney(a.cost, currency) : null }] : []),
            { label: t('Warranty until'), value: a.warranty_until && fmtDate(a.warranty_until) },
            { label: t('Serviced every'), value: a.service_every_months ? tn(a.service_every_months, '{n} month', '{n} months') : null },
            { label: t('Last service'), value: a.last_service_on && fmtDate(a.last_service_on) },
            { label: t('Next service'), value: a.next_service_on && fmtDate(a.next_service_on) },
            { label: t('Notes'), value: a.notes },
          ]} />
          <Card title="Services and repairs" pad={false}>
            <Table caption="Services and repairs" rows={a.services} empty="Nothing recorded yet." columns={[
              { key: 'on_date', label: 'When', render: (s) => fmtDate(s.on_date) },
              { key: 'kind', label: 'What', primary: true, render: (s) => <span className="min0"><span className="row-label">{t(s.kind_label)}</span><span className="row-sub">{[s.done_by, s.note].filter(Boolean).join(' · ')}</span></span> },
              ...(can('cost.view') ? [{ key: 'cost', label: 'Cost', align: 'right', render: (s) => (s.cost != null ? fmtMoney(s.cost, currency) : '') }] : []),
              { key: 'recorded_by_name', label: 'Recorded', render: (s) => <span className="min0"><span>{s.recorded_by_name}</span><span className="row-sub">{fmtDateTime(s.recorded_at)}</span></span> },
            ]} />
          </Card>
        </>
      )}
    </Sheet>
  );
}

function ServiceSheet({ asset, onClose, onDone }) {
  const { me, currency, toast, refreshBadges } = useApp();
  const [f, setF] = useState({ kind: 'SERVICE', onDate: today(), doneBy: '', cost: '', note: '', nextDue: '', backInUse: asset.status === 'IN_REPAIR' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await post(`/api/assets/${asset.id}/services`, f);
      toast(r.nextServiceOn ? t('Recorded. Next service {date}', { date: fmtDate(r.nextServiceOn) }) : 'Recorded');
      refreshBadges(); onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={t('Record a service: {tag}', { tag: asset.tag })} onClose={onClose} footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} icon="check" onClick={save}>Record it</Button></>}>
      <div className="form two">
        <Field label="What was done"><Select value={f.kind} onChange={(v) => set('kind', v)} options={Object.entries(me.labels.serviceKinds || {}).map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="When"><input type="date" value={f.onDate} max={today()} onChange={(e) => set('onDate', e.target.value)} /></Field>
        <Field label="By (optional)" hint="The engineer or company."><input value={f.doneBy} onChange={(e) => set('doneBy', e.target.value)} maxLength={120} /></Field>
        <Field label={t('Cost ({currency}, optional)', { currency })}><QtyInput value={f.cost} onChange={(v) => set('cost', v)} label="Cost" /></Field>
        <Field label="Next due (optional)" hint={asset.service_every_months ? t('Left empty: {n} months after this one. A repair does not move it.', { n: asset.service_every_months }) : 'When it should next be serviced.'}><input type="date" value={f.nextDue} onChange={(e) => set('nextDue', e.target.value)} /></Field>
        <Field label="Note (optional)"><input value={f.note} onChange={(e) => set('note', e.target.value)} maxLength={500} /></Field>
        {asset.status === 'IN_REPAIR' && f.kind === 'REPAIR' && <div className="span2"><Check checked={f.backInUse} onChange={(v) => set('backInUse', v)}>It is back in use</Check></div>}
      </div>
      <ErrorNote error={err} />
    </Sheet>
  );
}

function AssetForm({ asset, onClose, onSaved }) {
  const { me, lists, toast, currency, can } = useApp();
  const { data: suppliers } = useData('/api/suppliers');
  const [f, setF] = useState({
    tag: asset?.tag || '', name: asset?.name || '', category: asset?.category || '', make: asset?.make || '', model: asset?.model || '',
    serialNo: asset?.serial_no || '', areaId: asset?.area_id || '', location: asset?.location || '', supplierId: asset?.supplier_id || '',
    purchasedOn: asset?.purchased_on || '', cost: asset?.cost ?? '', warrantyUntil: asset?.warranty_until || '',
    serviceEveryMonths: asset?.service_every_months ?? '', lastServiceOn: asset?.last_service_on || '', nextServiceOn: asset?.next_service_on || '',
    status: asset?.status || 'ACTIVE', notes: asset?.notes || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      if (asset?.id) await put(`/api/assets/${asset.id}`, f); else await post('/api/assets', f);
      toast(asset?.id ? 'Saved' : t('{name} added', { name: f.name || t('Equipment') }));
      onSaved();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet wide title={asset?.id ? t('Edit {name}', { name: asset.tag }) : 'Add equipment'} onClose={onClose} footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
      <div className="form two">
        <Field label="What it is"><input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Steam chamber" maxLength={120} /></Field>
        <Field label="Asset number" hint="The number on its sticker."><input value={f.tag} onChange={(e) => set('tag', e.target.value.toUpperCase())} placeholder="EQ-014" maxLength={40} /></Field>
        <Field label="Serial number"><input value={f.serialNo} onChange={(e) => set('serialNo', e.target.value)} maxLength={80} /></Field>
        <Field label="Category (optional)"><input value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Analyser, furniture, appliance" maxLength={60} /></Field>
        <Field label="Make"><input value={f.make} onChange={(e) => set('make', e.target.value)} maxLength={60} /></Field>
        <Field label="Model"><input value={f.model} onChange={(e) => set('model', e.target.value)} maxLength={60} /></Field>
        <Field label="Room, bench or analyser"><Select value={f.areaId} onChange={(v) => set('areaId', v)} placeholder={`Not one of the unit's areas`} options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} /></Field>
        {!f.areaId && <Field label="Where, then"><input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Reception store cupboard" maxLength={120} /></Field>}
        <Field label="Supplier (optional)"><Select value={f.supplierId} onChange={(v) => set('supplierId', v)} placeholder="None" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Bought on"><input type="date" value={f.purchasedOn} onChange={(e) => set('purchasedOn', e.target.value)} /></Field>
        {can('cost.view') && <Field label={t('Cost ({currency})', { currency })}><QtyInput value={f.cost} onChange={(v) => set('cost', v)} label="Cost" /></Field>}
        <Field label="Warranty until"><input type="date" value={f.warrantyUntil} onChange={(e) => set('warrantyUntil', e.target.value)} /></Field>
        <Field label="Serviced every (months)" hint="Leave empty if it has no service plan."><input type="number" min="1" max="120" inputMode="numeric" value={f.serviceEveryMonths} onChange={(e) => set('serviceEveryMonths', e.target.value)} /></Field>
        <Field label="Last serviced"><input type="date" value={f.lastServiceOn} onChange={(e) => set('lastServiceOn', e.target.value)} /></Field>
        <Field label="Next service (optional)" hint="Left empty: worked out from the last service, or the purchase date, and the months between."><input type="date" value={f.nextServiceOn} onChange={(e) => set('nextServiceOn', e.target.value)} /></Field>
        {asset?.id && <Field label="Status"><Select value={f.status} onChange={(v) => set('status', v)} options={Object.entries(me.labels.assetStatus || {}).map(([value, label]) => ({ value, label }))} /></Field>}
        <Field label="Notes" className="span2"><textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} maxLength={500} /></Field>
      </div>
      <ErrorNote error={err} />
    </Sheet>
  );
}
