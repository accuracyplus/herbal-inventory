/**
 * The IT register (Design Guide D-086, 22 Nov 2026; docs/it-assets.md): devices, SIMs and
 * licences, who holds each, every hand-over with its condition and photos, exit clearance from
 * HiFive ID's leaving dates, IT's purchase requests and HR's email account requests, and the
 * spares to keep. It lives in the Equipment screen (Sinu: "Grow Equipment"); spa equipment is
 * untouched (Assets.jsx).
 */

import { useState } from 'react';
import { KeyValues } from '@hifive/ui';
import { fmtDate, fmtDateTime, fmtMoney, openFile, post, put, sendForm, shrinkImage } from '../api.js';
import {
  Button, CancelButton, Card, ConfirmButton, ErrorNote, Field, Loading, Note, Page, PersonPicker, Pill, QtyInput, Quiet, SearchBox, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';
import { t, tn } from '../i18n.js';

const STATE_TONE = { IN_STOCK: 'plain', ASSIGNED: 'ok', IN_REPAIR: 'warn', IDLE: 'warn', RETIRED: 'faint' };
const SHOWS = [['all', 'All'], ['IN_STOCK', 'In stock'], ['ASSIGNED', 'Assigned'], ['IN_REPAIR', 'In repair'], ['IDLE', 'Idle'], ['retired', 'Retired']];
const KINDS = [['it', 'Everything'], ['DEVICE', 'Devices'], ['SIM', 'SIMs'], ['LICENCE', 'Licences']];
const today = () => new Date(Date.now() + 4 * 36e5).toISOString().slice(0, 10);
/** A hand-over window's title says what is being done; the history says what was done. */
const DOING = {
  ISSUE: 'Issue {tag}', RETURN: 'Take back {tag}', REPAIR_OUT: 'Send {tag} for repair', REPAIR_BACK: '{tag} back from repair',
  IDLE: 'Mark {tag} idle', STOCK: 'Put {tag} back in stock',
};

/** What a piece is, in one line under its name: its number, kind, serial or SIM digits. */
const subLine = (a) => [a.tag, a.kind_label && t(a.kind_label), a.kind === 'SIM' ? `•••• ${a.sim_last4}${a.network ? ` · ${a.network}` : ''}` : a.serial_no, a.category]
  .filter(Boolean).join(' · ');

export default function ItRegister({ switcher }) {
  const { can, route, navigate } = useApp();
  const tab = route.query.get('tab') || 'register';
  const tabs = [
    ['register', 'Register'],
    ...(can('it.edit') ? [['clear', 'To clear']] : []),
    ['requests', 'Requests'],
    ...(can('it.view') ? [['spares', 'Spares']] : []),
  ];
  const go = (t2) => navigate(`assets?kind=it${t2 === 'register' ? '' : `&tab=${t2}`}`);
  return (
    <Page title="IT register" subtitle="Devices, SIMs and licences: who holds each one, how it was handed over, and what is due."
      actions={tab === 'register' && can('it.edit') && <AddButton />}>
      {switcher}
      <Segmented label="Section" value={tab} onChange={go} options={tabs.map(([value, label]) => ({ value, label }))} />
      {tab === 'register' && <Register />}
      {tab === 'clear' && can('it.edit') && <Clearance />}
      {tab === 'requests' && <Requests />}
      {tab === 'spares' && <Spares />}
    </Page>
  );
}

function AddButton() {
  const [adding, setAdding] = useState(false);
  const { navigate } = useApp();
  return (
    <>
      <Button icon="plus" onClick={() => setAdding(true)}>Add an IT item</Button>
      {adding && <ItForm onClose={() => setAdding(false)} onSaved={(id) => { setAdding(false); navigate(`assets/${id}?kind=it`); }} />}
    </>
  );
}

// ── Register ─────────────────────────────────────────────────────────────────

function Register() {
  const { route, navigate } = useApp();
  const [q, setQ] = useState('');
  const kind = ['DEVICE', 'SIM', 'LICENCE'].includes(route.query.get('kind')) ? route.query.get('kind') : 'it';
  const show = route.query.get('show') || 'all';
  const { data, error, loading, reload } = useData(`/api/assets?kind=${kind}&show=${show}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`, [kind, show, q]);
  const at = (k, s) => navigate(`assets?kind=${k}${s === 'all' ? '' : `&show=${s}`}`);
  return (
    <>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search number, name, holder, serial or SIM digits" /></div>
      <Segmented label="Kind" value={kind} onChange={(k) => at(k, show)} options={KINDS.map(([value, label]) => ({ value, label }))} />
      <Segmented label="Show" value={show} onChange={(s) => at(kind, s)} options={SHOWS.map(([value, label]) => ({ value, label }))} />
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.length && <Card><Quiet>{show === 'all' && kind === 'it' && !q ? 'Nothing in the IT register yet. Add the first device, SIM or licence.' : 'Nothing here.'}</Quiet></Card>}
      {data?.length > 0 && (
        <Card pad={false}>
          <Table caption="IT register" rows={data} onRow={(a) => navigate(`assets/${a.id}?kind=${kind}${show === 'all' ? '' : `&show=${show}`}`)} columns={[
            { key: 'name', label: 'Item', primary: true, render: (a) => <span className="min0"><span className="row-label">{a.name}</span><span className="row-sub">{subLine(a)}</span></span> },
            { key: 'holder_name', label: 'Held by', sort: (a) => a.holder_name || '', render: (a) => (a.kind === 'LICENCE'
              ? t('{used} of {seats} seats', { used: a.seats_used ?? 0, seats: a.seats ?? '?' })
              : a.holder_name ? <span className="min0"><span>{a.holder_name}</span><span className="row-sub">{a.holder_code}</span></span> : <span className="faint">{t('Nobody')}</span>) },
            { key: 'state', label: 'State', render: (a) => (a.state && (a.kind !== 'LICENCE' || a.state === 'RETIRED') ? <span className="row"><Pill tone={STATE_TONE[a.state] || 'plain'}>{t(a.state_label)}</Pill>{a.condition_label && <span className="muted">{t(a.condition_label)}</span>}</span> : '') },
            { key: 'due', label: 'Warranty or renewal', sort: (a) => a.renews_on || a.warranty_until || '9999', render: (a) => {
              const day = a.kind === 'LICENCE' ? a.renews_on : a.warranty_until;
              const how = a.kind === 'LICENCE' ? a.renewal : a.warranty;
              return day ? <span className="row">{fmtDate(day)}{how && how !== 'OK' && <Pill tone={how === 'ENDED' ? 'danger' : 'warn'}>{how === 'ENDED' ? (a.kind === 'LICENCE' ? 'Lapsed' : 'Ended') : 'Ending soon'}</Pill>}</span> : '';
            } },
          ]} />
        </Card>
      )}
      {route.id && <ItAssetSheet id={route.id} onClose={() => navigate(`assets?kind=${kind}${show === 'all' ? '' : `&show=${show}`}`)} onChanged={reload} />}
    </>
  );
}

function ItAssetSheet({ id, onClose, onChanged }) {
  const { can, currency, toast } = useApp();
  const { data: a, error, loading, reload } = useData(`/api/assets/${id}`, [id]);
  const [doing, setDoing] = useState(null);   // a hand-over, a seat, or an edit: each takes this window's place
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const done = () => { setDoing(null); reload(); onChanged(); };
  if (doing?.edit && a) return <ItForm asset={a} onClose={() => setDoing(null)} onSaved={done} />;
  if (doing?.action && a) return <HandoverSheet asset={a} action={doing.action} onClose={() => setDoing(null)} onDone={done} />;
  if (doing?.seat && a) return <SeatSheet asset={a} onClose={() => setDoing(null)} onDone={done} />;
  const retire = async () => {
    setBusy(true); setErr(null);
    try { await post(`/api/assets/${a.id}/handover`, { action: 'RETIRE' }); toast(t('{tag} retired', { tag: a.tag })); reload(); onChanged(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const endSeat = async (s) => {
    setErr(null);
    try { await post(`/api/assets/${a.id}/seats/${s.id}/end`, {}); toast(t('{name} no longer holds a seat', { name: s.holder_name })); reload(); onChanged(); } catch (e) { setErr(e); }
  };
  const attach = async (files) => {
    setErr(null);
    for (const f of files) {
      try { await sendForm(`/api/assets/${a.id}/files`, { kind: 'INVOICE', file: await shrinkImage(f) }); } catch (e) { setErr(e); }
    }
    reload();
  };
  const st = a?.state;
  const edits = a && can('it.edit') && st !== 'RETIRED';
  return (
    <Sheet wide title={a ? a.name : 'IT item'} onClose={onClose}
      footer={edits && (
        <>
          <Button kind="secondary" icon="edit" onClick={() => setDoing({ edit: true })}>Edit</Button>
          {a.kind !== 'LICENCE' && ['IN_STOCK', 'IDLE'].includes(st) && <Button kind="secondary" onClick={() => setDoing({ action: 'REPAIR_OUT' })}>Send for repair</Button>}
          {a.kind !== 'LICENCE' && st === 'IN_STOCK' && <Button kind="secondary" onClick={() => setDoing({ action: 'IDLE' })}>Mark idle</Button>}
          {a.kind !== 'LICENCE' && st === 'IDLE' && <Button kind="secondary" onClick={() => setDoing({ action: 'STOCK' })}>Back in stock</Button>}
          {st !== 'ASSIGNED' && (a.kind !== 'LICENCE' || !a.seats_used) && (
            <ConfirmButton busy={busy} ask={t('Retire {tag}? It leaves the register’s working lists for good.', { tag: a.tag })} yes="Yes, retire it" onConfirm={retire}>Retire</ConfirmButton>
          )}
          {a.kind !== 'LICENCE' && ['IN_STOCK', 'IDLE'].includes(st) && <Button icon="custody" onClick={() => setDoing({ action: 'ISSUE' })}>Issue to somebody</Button>}
          {a.kind !== 'LICENCE' && st === 'ASSIGNED' && <Button icon="custody" onClick={() => setDoing({ action: 'RETURN' })}>Take it back</Button>}
          {a.kind !== 'LICENCE' && st === 'IN_REPAIR' && <Button onClick={() => setDoing({ action: 'REPAIR_BACK' })}>Back from repair</Button>}
          {a.kind === 'LICENCE' && <Button icon="plus" onClick={() => setDoing({ seat: true })}>Give a seat</Button>}
        </>
      )}>
      <ErrorNote error={error || err} />
      {loading && !a && <Loading />}
      {a && (
        <>
          <div className="row">
            {a.state && (a.kind !== 'LICENCE' || a.state === 'RETIRED') && <Pill tone={STATE_TONE[a.state] || 'plain'}>{t(a.state_label)}</Pill>}
            {a.holder_name && <span className="muted">{t('With {name} since {date}', { name: a.holder_name, date: fmtDate(a.state_since) })}</span>}
          </div>
          <KeyValues columns={3} items={[
            { label: t('Asset number'), value: a.tag }, { label: t('Kind'), value: a.kind_label && t(a.kind_label) },
            { label: t('Category'), value: a.category },
            ...(a.kind === 'SIM' ? [{ label: t('SIM number ends'), value: a.sim_last4 && `•••• ${a.sim_last4}` }, { label: t('Network'), value: a.network }] : []),
            ...(a.kind === 'LICENCE' ? [{ label: t('Seats'), value: t('{used} of {seats} taken', { used: a.seats_used ?? 0, seats: a.seats }) }, { label: t('Renews'), value: a.renews_on && fmtDate(a.renews_on) }] : []),
            ...(a.kind === 'DEVICE' ? [{ label: t('Make and model'), value: [a.make, a.model].filter(Boolean).join(' ') }, { label: t('Serial number'), value: a.serial_no }] : []),
            { label: t('Condition'), value: a.condition_label && t(a.condition_label) },
            { label: t('Where'), value: [a.area_name || a.location, a.department_name].filter(Boolean).join(', ') },
            { label: t('Supplier'), value: a.supplier_name }, { label: t('Bought'), value: a.purchased_on && fmtDate(a.purchased_on) },
            ...(a.cost !== undefined ? [{ label: t('Price'), value: a.cost != null ? fmtMoney(a.cost, currency) : null }] : []),
            ...(a.kind !== 'LICENCE' ? [{ label: t('Warranty until'), value: a.warranty_until && fmtDate(a.warranty_until) }] : []),
            { label: t('Notes'), value: a.notes },
          ]} />
          {a.kind === 'LICENCE' && (
            <Card title="Seats" pad={false}>
              <Table caption="Seats" rows={a.seats.filter((s) => !s.until_at)} empty="Nobody holds a seat." columns={[
                { key: 'holder_name', label: 'Who', primary: true, render: (s) => <span className="min0"><span className="row-label">{s.holder_name}</span><span className="row-sub">{s.holder_code}</span></span> },
                { key: 'from_at', label: 'Since', render: (s) => fmtDate(s.from_at) },
                ...(can('it.edit') ? [{ key: 'end', label: '', sortable: false, render: (s) => <ConfirmButton kind="ghost" ask={t('End {name}’s seat?', { name: s.holder_name })} yes="Yes, end it" onConfirm={() => endSeat(s)}>End</ConfirmButton> }] : []),
              ]} />
            </Card>
          )}
          {a.kind !== 'LICENCE' && (
            <Card title="Hand-overs" pad={false}>
              <Table caption="Hand-overs" rows={a.handovers} empty="No hand-over yet." columns={[
                { key: 'at', label: 'When', render: (h) => fmtDateTime(h.at) },
                { key: 'action', label: 'What', primary: true, render: (h) => <span className="min0"><span className="row-label">{t(h.action_label)}{h.clearance ? ` · ${t('exit clearance')}` : ''}</span><span className="row-sub">{[h.to_name && t('to {name}', { name: h.to_name }), h.from_name && t('from {name}', { name: h.from_name }), h.note].filter(Boolean).join(' · ')}</span></span> },
                { key: 'condition', label: 'Condition', render: (h) => (h.condition_label ? t(h.condition_label) : '') },
                { key: 'photos', label: 'Photos', sortable: false, render: (h) => (h.photos.length ? <span className="row">{h.photos.map((p, i) => <button key={p.id} type="button" className="link" onClick={() => openFile(p.id, p.name)}>{t('Photo {n}', { n: i + 1 })}</button>)}</span> : '') },
                { key: 'by_name', label: 'By', render: (h) => h.by_name },
              ]} />
            </Card>
          )}
          {a.kind === 'LICENCE' && a.seats.some((s) => s.until_at) && (
            <Card title="Earlier seat holders" pad={false}>
              <Table caption="Earlier seat holders" rows={a.seats.filter((s) => s.until_at)} columns={[
                { key: 'holder_name', label: 'Who', primary: true, render: (s) => s.holder_name },
                { key: 'from_at', label: 'From', render: (s) => fmtDate(s.from_at) },
                { key: 'until_at', label: 'Until', render: (s) => fmtDate(s.until_at) },
              ]} />
            </Card>
          )}
          {a.files !== undefined && (
            <Card title="Invoices" hint="Seen only by IT, HR and the directors, as the price is.">
              {a.files.length ? (
                <ul className="lots">{a.files.map((f) => <li key={f.id} className="lot"><button type="button" className="link" onClick={() => openFile(f.id, f.name)}>{f.name}</button><span className="muted">{fmtDate(f.uploaded_at)}</span></li>)}</ul>
              ) : <Quiet>No invoice attached yet.</Quiet>}
              {can('it.edit') && <Field label="Attach an invoice"><input type="file" accept="image/*,application/pdf" multiple onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; attach(fs); }} /></Field>}
            </Card>
          )}
        </>
      )}
    </Sheet>
  );
}

/** One hand-over: who to, the condition seen, a note and photos (Part Q; evidence is never cropped). */
function HandoverSheet({ asset, action, clearance = false, issued, onClose, onDone }) {
  const { me, toast } = useApp();
  const { data: people } = useData(action === 'ISSUE' ? '/api/it/people' : null, [action]);
  const [to, setTo] = useState(null);
  const [cond, setCond] = useState(action === 'ISSUE' ? (asset.condition || 'GOOD') : '');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const words = me.labels.handoverActions || {};
  const needsCondition = ['ISSUE', 'RETURN', 'REPAIR_BACK'].includes(action);
  // The condition it was issued in, beside the one it comes back in (D-086, exit clearance).
  const was = issued || (action === 'RETURN' ? (asset.handovers || []).find((h) => h.action === 'ISSUE' && h.to_code === asset.holder_code) : null);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await post(`/api/assets/${asset.id}/handover`, { action, toCode: to?.code, condition: cond || undefined, note, clearance });
      const failed = [];
      for (const f of photos) {
        try { await sendForm(`/api/handovers/${r.handoverId}/photos`, { file: await shrinkImage(f) }); } catch (e) { failed.push(`${f.name}: ${e.message}`); }
      }
      if (failed.length) toast(tn(failed.length, 'Saved, but {n} photo could not be sent. Add it again from the history.', 'Saved, but {n} photos could not be sent. Add them again from the history.'), 'danger');
      else toast(t('{what}: {tag}', { what: t(words[action] || action), tag: asset.tag }));
      onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={t(DOING[action] || '{tag}', { tag: asset.tag })} onClose={onClose}
      footer={<><CancelButton onClick={onClose} /><Button busy={busy} icon="check" onClick={save}>Save</Button></>}>
      {action === 'ISSUE' && (to
        ? <div className="row"><b className="grow">{to.name}</b><span className="muted">{to.code}</span><Button kind="ghost" onClick={() => setTo(null)}>Change</Button></div>
        : people ? <PersonPicker people={people} onPick={setTo} label="Issue to" /> : <Loading what="Reading HiFive ID’s staff list" />)}
      {action === 'RETURN' && <Note icon="custody">{t('From {name} ({code}).', { name: asset.holder_name, code: asset.holder_code })}{was?.condition ? ` ${t('Issued {date} in {condition} condition.', { date: fmtDate(was.at || was.issued_at), condition: t(me.labels.conditions?.[was.condition] || was.condition).toLowerCase() })}` : ''}</Note>}
      {needsCondition && (
        <Field label={action === 'RETURN' ? 'Condition now' : 'Condition'} hint={action === 'RETURN' ? 'Look at it before you choose: the history keeps both.' : undefined}>
          <Select value={cond} onChange={setCond} placeholder="Choose" options={Object.entries(me.labels.conditions || {}).map(([value, label]) => ({ value, label }))} />
        </Field>
      )}
      <Field label={['POOR', 'DAMAGED'].includes(cond) ? 'What is wrong with it' : 'Note (optional)'}><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
      {action !== 'RETIRE' && (
        <Field label="Photos" hint="Of its condition, as it is now. They are kept as they are taken, never cropped.">
          <input type="file" accept="image/*" capture="environment" multiple onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; setPhotos((p) => [...p, ...fs].slice(0, 6)); }} />
        </Field>
      )}
      {photos.length > 0 && <p className="muted">{tn(photos.length, '{n} photo ready', '{n} photos ready')}</p>}
      <ErrorNote error={err} />
    </Sheet>
  );
}

function SeatSheet({ asset, onClose, onDone }) {
  const { toast } = useApp();
  const { data: people } = useData('/api/it/people');
  const [to, setTo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const save = async () => {
    if (!to) { setErr(new Error(t('Choose who gets the seat.'))); return; }
    setBusy(true); setErr(null);
    try { await post(`/api/assets/${asset.id}/seats`, { code: to.code }); toast(t('{name} has a seat of {product}', { name: to.name, product: asset.name })); onDone(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={t('Give a seat: {product}', { product: asset.name })} onClose={onClose}
      footer={<><CancelButton onClick={onClose} /><Button busy={busy} icon="check" onClick={save}>Give the seat</Button></>}>
      <p className="muted">{t('{used} of {seats} seats are taken.', { used: asset.seats_used ?? 0, seats: asset.seats })}</p>
      {to
        ? <div className="row"><b className="grow">{to.name}</b><span className="muted">{to.code}</span><Button kind="ghost" onClick={() => setTo(null)}>Change</Button></div>
        : people ? <PersonPicker people={people} onPick={setTo} label="Who" /> : <Loading what="Reading HiFive ID’s staff list" />}
      <ErrorNote error={err} />
    </Sheet>
  );
}

function ItForm({ asset, onClose, onSaved }) {
  const { me, lists, toast, currency, can } = useApp();
  const { data: suppliers } = useData('/api/suppliers');
  const [f, setF] = useState({
    kind: asset?.kind || 'DEVICE', tag: asset?.tag || '', name: asset?.name || '', category: asset?.category || '', make: asset?.make || '', model: asset?.model || '',
    serialNo: asset?.serial_no || '', simLast4: asset?.sim_last4 || '', network: asset?.network || '', seats: asset?.seats ?? '', renewsOn: asset?.renews_on || '',
    areaId: asset?.area_id || '', location: asset?.location || '', supplierId: asset?.supplier_id || '', purchasedOn: asset?.purchased_on || '',
    cost: asset?.cost ?? '', warrantyUntil: asset?.warranty_until || '', condition: asset?.condition || 'NEW', notes: asset?.notes || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = asset?.id ? await put(`/api/assets/${asset.id}`, f) : await post('/api/assets', f);
      toast(asset?.id ? 'Saved' : t('{name} added', { name: f.name }));
      onSaved(r.id);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const k = f.kind;
  return (
    <Sheet wide title={asset?.id ? t('Edit {name}', { name: asset.tag }) : 'Add an IT item'} onClose={onClose}
      footer={<><CancelButton onClick={onClose} /><Button busy={busy} onClick={save}>Save</Button></>}>
      <div className="form two">
        {!asset?.id && <Field label="What it is" className="span2"><Segmented label="Kind" value={k} onChange={(v) => set('kind', v)} options={Object.entries(me.labels.itKinds || {}).map(([value, label]) => ({ value, label }))} /></Field>}
        <Field label={k === 'LICENCE' ? 'Product' : 'Name'}><input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder={k === 'LICENCE' ? 'Microsoft 365 Business Standard' : k === 'SIM' ? 'Data SIM, reception phone' : 'Laptop, Dell Latitude'} maxLength={120} /></Field>
        <Field label="Asset number" hint="The number on its sticker, or a new one."><input value={f.tag} onChange={(e) => set('tag', e.target.value.toUpperCase())} placeholder={k === 'LICENCE' ? 'LIC-001' : k === 'SIM' ? 'SIM-001' : 'IT-001'} maxLength={40} /></Field>
        {k === 'DEVICE' && <Field label="Category" hint="Laptop, phone, monitor, server: spares are kept by category."><input value={f.category} onChange={(e) => set('category', e.target.value)} placeholder="Laptop" maxLength={60} /></Field>}
        {k === 'DEVICE' && <Field label="Serial number"><input value={f.serialNo} onChange={(e) => set('serialNo', e.target.value)} maxLength={80} /></Field>}
        {k === 'DEVICE' && <Field label="Make"><input value={f.make} onChange={(e) => set('make', e.target.value)} maxLength={60} /></Field>}
        {k === 'DEVICE' && <Field label="Model"><input value={f.model} onChange={(e) => set('model', e.target.value)} maxLength={60} /></Field>}
        {k === 'SIM' && <Field label="Last 4 digits of the number" hint="Only these four: the whole number is never kept."><input value={f.simLast4} onChange={(e) => set('simLast4', e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" maxLength={4} placeholder="1234" /></Field>}
        {k === 'SIM' && <Field label="Network"><input value={f.network} onChange={(e) => set('network', e.target.value)} placeholder="du, Etisalat" maxLength={40} /></Field>}
        {k === 'LICENCE' && <Field label="Seats" hint="How many people it covers."><input type="number" min="1" inputMode="numeric" value={f.seats} onChange={(e) => set('seats', e.target.value)} /></Field>}
        {k === 'LICENCE' && <Field label="Renews on"><input type="date" value={f.renewsOn} onChange={(e) => set('renewsOn', e.target.value)} /></Field>}
        {k !== 'LICENCE' && <Field label="Room or area (optional)"><Select value={f.areaId} onChange={(v) => set('areaId', v)} placeholder="Not one of the unit's areas" options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} /></Field>}
        {k !== 'LICENCE' && !f.areaId && <Field label="Where, then (optional)"><input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Server room" maxLength={120} /></Field>}
        <Field label="Supplier (optional)"><Select value={f.supplierId} onChange={(v) => set('supplierId', v)} placeholder="None" options={(suppliers || []).map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Bought on"><input type="date" value={f.purchasedOn} onChange={(e) => set('purchasedOn', e.target.value)} /></Field>
        {can('it.prices') && <Field label={t('Price ({currency})', { currency })}><QtyInput value={f.cost} onChange={(v) => set('cost', v)} label="Price" /></Field>}
        {k !== 'LICENCE' && <Field label="Warranty until"><input type="date" value={f.warrantyUntil} onChange={(e) => set('warrantyUntil', e.target.value)} /></Field>}
        {!asset?.id && k !== 'LICENCE' && <Field label="Condition"><Select value={f.condition} onChange={(v) => set('condition', v)} options={Object.entries(me.labels.conditions || {}).map(([value, label]) => ({ value, label }))} /></Field>}
        <Field label="Notes" className="span2" hint={k === 'LICENCE' ? 'Never type the licence key here: keep it in the licence portal.' : undefined}><textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} maxLength={500} /></Field>
      </div>
      <ErrorNote error={err} />
    </Sheet>
  );
}

// ── Exit clearance ───────────────────────────────────────────────────────────

function Clearance() {
  const { me, toast } = useApp();
  const { data, error, loading, reload } = useData('/api/it/clearance');
  const [taking, setTaking] = useState(null);
  const [err, setErr] = useState(null);
  const { data: full } = useData(taking ? `/api/assets/${taking.item.id}` : null, [taking?.item.id]);
  if (taking && full) {
    return <HandoverSheet asset={full} action="RETURN" clearance issued={{ condition: taking.item.issued_condition, at: taking.item.issued_at }}
      onClose={() => setTaking(null)} onDone={() => { setTaking(null); reload(); }} />;
  }
  const endSeat = async (s) => {
    setErr(null);
    try { await post(`/api/assets/${s.id}/seats/${s.seat_id}/end`, { clearance: true }); toast(t('{name} no longer holds a seat', { name: s.holder_name })); reload(); } catch (e) { setErr(e); }
  };
  return (
    <>
      <Quiet icon="info">People HiFive ID says have left, or leave within 30 days, who still hold something here. Take each thing back and record its condition.</Quiet>
      <ErrorNote error={error || err} onRetry={reload} />
      {loading && !data && <Loading what="Reading HiFive ID’s staff list" />}
      {data && !data.length && <Card><Quiet>Nobody leaving holds anything.</Quiet></Card>}
      {(data || []).map((p) => (
        <Card key={p.code} title={p.name} hint={p.left ? t('{code} · left {date}', { code: p.code, date: p.endDate ? fmtDate(p.endDate) : '' }) : t('{code} · leaves {date}', { code: p.code, date: fmtDate(p.endDate) })}
          actions={<Pill tone={p.left ? 'danger' : 'warn'}>{p.left ? 'Has left' : 'Leaving'}</Pill>}>
          <ul className="lots">
            {p.items.map((i) => (
              <li key={i.id} className="lot">
                <div className="min0 grow"><span className="row-label">{i.name}</span><span className="row-sub">{[i.tag, i.issued_condition && t('issued {condition}', { condition: t(me.labels.conditions?.[i.issued_condition] || i.issued_condition).toLowerCase() }), i.issued_at && fmtDate(i.issued_at)].filter(Boolean).join(' · ')}</span></div>
                <Button kind="secondary" icon="custody" onClick={() => setTaking({ item: i })}>Take it back</Button>
              </li>
            ))}
            {p.seats.map((s) => (
              <li key={s.seat_id} className="lot">
                <div className="min0 grow"><span className="row-label">{s.name}</span><span className="row-sub">{t('Licence seat since {date}', { date: fmtDate(s.from_at) })}</span></div>
                <ConfirmButton ask={t('End {name}’s seat of {product}?', { name: p.name, product: s.name })} yes="Yes, end it" onConfirm={() => endSeat(s)}>End the seat</ConfirmButton>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  );
}

// ── Requests ─────────────────────────────────────────────────────────────────

function Requests() {
  const { can, me } = useApp();
  const [status, setStatus] = useState('open');
  const { data: got, error, loading, reload } = useData(`/api/it/requests?status=${status}`, [status]);
  const [raising, setRaising] = useState(null);
  const [open, setOpen] = useState(null);
  const data = got?.rows;
  const head = got?.unitHead;
  const waitsOnHead = data?.some((r) => r.kind === 'PURCHASE' && r.status === 'PENDING');
  return (
    <>
      <div className="row">
        <Segmented label="Show" value={status} onChange={setStatus} options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]} />
        <span className="grow" />
        {can('it.purchase') && <Button kind="secondary" icon="plus" onClick={() => setRaising('PURCHASE')}>Purchase request</Button>}
        {can('it.email') && <Button kind="secondary" icon="plus" onClick={() => setRaising('EMAIL_ACCOUNT')}>Email account request</Button>}
      </div>
      <ErrorNote error={error} onRetry={reload} />
      <UnitHeadNote head={head} waiting={waitsOnHead} unit={me.unit?.name} />
      {loading && !data && <Loading />}
      {data && !data.length && <Card><Quiet>{status === 'open' ? 'No open requests.' : 'Nothing closed yet.'}</Quiet></Card>}
      {data?.length > 0 && (
        <Card pad={false}>
          <Table caption="IT requests" rows={data} onRow={setOpen} columns={[
            { key: 'ref', label: 'Request', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.title}</span><span className="row-sub">{[r.ref, t(r.kind_label)].join(' · ')}</span></span> },
            { key: 'needed_by', label: 'Needed by', render: (r) => (r.needed_by ? fmtDate(r.needed_by) : '') },
            { key: 'status', label: 'Status', render: (r) => <Pill tone={r.status === 'PENDING' || r.status === 'HEAD_APPROVED' ? 'warn' : r.status === 'APPROVED' ? 'ok' : 'plain'}>{t(r.status_label)}</Pill> },
            { key: 'raised_name', label: 'Raised by', render: (r) => <span className="min0"><span>{r.raised_name}</span><span className="row-sub">{fmtDate(r.raised_at)}</span></span> },
          ]} />
        </Card>
      )}
      {raising && <RaiseSheet kind={raising} onClose={() => setRaising(null)} onDone={() => { setRaising(null); reload(); }} />}
      {open && <RequestSheet r={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload(); }} />}
    </>
  );
}

/**
 * Who takes a purchase's first step, said above the list (Sinu, 27 Nov 2026: the facility's unit
 * head first, then Accounts). When HiFive ID cannot be asked, it says so rather than showing an
 * empty queue as if nothing waited.
 */
function UnitHeadNote({ head, waiting, unit }) {
  if (!head) return null;
  if (!head.setUp) return waiting ? <Note tone="warn">{t('Purchase requests wait for the unit head, and Inventory cannot ask HiFive ID who that is yet.')}</Note> : null;
  if (head.error) return <Note tone="warn">{t('HiFive ID could not confirm the unit head just now, so purchase requests cannot be approved. Try again shortly.')}</Note>;
  if (!head.names.length) return <Note tone="warn">{t('HiFive ID lists no unit head for {unit}, so purchase requests cannot be approved. HR adds one in HiFive ID’s facility contacts.', { unit })}</Note>;
  return <Quiet icon="info">{head.you
    ? t('You approve purchase requests first, as the unit head. Accounts approves them after you.')
    : t('Purchase requests are approved by the unit head ({names}), then Accounts.', { names: head.names.join(', ') })}</Quiet>;
}

function RaiseSheet({ kind, onClose, onDone }) {
  const { can, currency, toast } = useApp();
  const { data: people } = useData(kind === 'EMAIL_ACCOUNT' ? '/api/it/people' : null, [kind]);
  const [f, setF] = useState({ title: '', details: '', estimate: '', neededBy: '', forName: '', forCode: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true); setErr(null);
    try { const r = await post('/api/it/requests', { kind, ...f }); toast(t('{ref} raised', { ref: r.ref })); onDone(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={kind === 'PURCHASE' ? 'IT purchase request' : 'New email account'} onClose={onClose}
      footer={<><CancelButton onClick={onClose} /><Button busy={busy} icon="check" onClick={save}>{kind === 'PURCHASE' ? 'Send to the unit head' : 'Send to IT'}</Button></>}>
      {kind === 'PURCHASE' ? (
        <div className="form two">
          <Field label="What is to be bought" className="span2"><input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="2 laptops for the new front desk" maxLength={160} /></Field>
          {can('it.prices') && <Field label={t('Estimate ({currency}, optional)', { currency })}><QtyInput value={f.estimate} onChange={(v) => set('estimate', v)} label="Estimate" /></Field>}
          <Field label="Needed by (optional)"><input type="date" value={f.neededBy} min={today()} onChange={(e) => set('neededBy', e.target.value)} /></Field>
          <Field label="Why, and any detail" className="span2"><textarea value={f.details} onChange={(e) => set('details', e.target.value)} maxLength={1000} /></Field>
        </div>
      ) : (
        <div className="form two">
          <div className="span2">
            {f.forCode
              ? <div className="row"><b className="grow">{f.forName}</b><span className="muted">{f.forCode}</span><Button kind="ghost" onClick={() => setF((x) => ({ ...x, forName: '', forCode: '' }))}>Change</Button></div>
              : people ? <PersonPicker people={people} label="Who it is for" onPick={(p) => setF((x) => ({ ...x, forName: p.name, forCode: p.code }))} /> : <Loading what="Reading HiFive ID’s staff list" />}
          </div>
          {!f.forCode && <Field label="Or their name, if HiFive ID does not have them yet" className="span2"><input value={f.forName} onChange={(e) => set('forName', e.target.value)} maxLength={120} /></Field>}
          <Field label="Needed by (their first day)"><input type="date" value={f.neededBy} onChange={(e) => set('neededBy', e.target.value)} /></Field>
          <Field label="Anything IT should know" className="span2"><textarea value={f.details} onChange={(e) => set('details', e.target.value)} maxLength={1000} placeholder="Role, which mailboxes or groups, a shared mailbox to join" /></Field>
        </div>
      )}
      <ErrorNote error={err} />
    </Sheet>
  );
}

function RequestSheet({ r, onClose, onDone }) {
  const { can, me, currency, toast } = useApp();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const act = async (action, msg) => {
    setBusy(true); setErr(null);
    try { await post(`/api/it/requests/${r.id}/${action}`, { note }); toast(t(msg)); onDone(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  // The server says who may decide which step (the unit head, as HiFive ID names them, then Accounts).
  const decides = !!r.may_decide;
  const doable = can('it.edit') && ((r.kind === 'PURCHASE' && r.status === 'APPROVED') || (r.kind === 'EMAIL_ACCOUNT' && r.status === 'PENDING'));
  const cancels = !!r.may_cancel;
  return (
    <Sheet title={`${r.ref} · ${r.title}`} onClose={onClose}
      footer={(decides || doable || cancels) && (
        <>
          {cancels && <ConfirmButton kind="ghost" busy={busy} ask="Withdraw this request?" yes="Yes, withdraw it" onConfirm={() => act('cancel', 'Withdrawn')}>Withdraw</ConfirmButton>}
          {decides && <Button kind="secondary" busy={busy} onClick={() => act('reject', 'Turned down')}>Turn down</Button>}
          {decides && <Button busy={busy} icon="check" onClick={() => act('approve', r.status === 'PENDING' ? 'Approved, and sent to Accounts' : 'Approved')}>{r.status === 'PENDING' ? 'Approve, send to Accounts' : 'Approve'}</Button>}
          {doable && <Button busy={busy} icon="check" onClick={() => act('done', 'Done')}>{r.kind === 'PURCHASE' ? 'Bought' : 'Account made'}</Button>}
        </>
      )}>
      <KeyValues columns={2} items={[
        { label: t('Kind'), value: t(r.kind_label) }, { label: t('Status'), value: t(r.status_label) },
        { label: t('For'), value: r.for_name && [r.for_name, r.for_code].filter(Boolean).join(' · ') },
        { label: t('Needed by'), value: r.needed_by && fmtDate(r.needed_by) },
        ...(r.estimate !== undefined ? [{ label: t('Estimate'), value: r.estimate != null ? fmtMoney(r.estimate, currency) : null }] : []),
        { label: t('Raised by'), value: `${r.raised_name}, ${fmtDateTime(r.raised_at)}` },
        { label: t('Unit head'), value: r.head_name && `${r.head_name}, ${fmtDateTime(r.head_at)}${r.head_note ? `: ${r.head_note}` : ''}` },
        { label: t(r.head_name && r.decided_name !== r.head_name ? 'Accounts' : 'Decided'), value: r.decided_name && (r.decided_name !== r.head_name || r.decided_at !== r.head_at) && `${r.decided_name}, ${fmtDateTime(r.decided_at)}${r.decision_note ? `: ${r.decision_note}` : ''}` },
        { label: t('Done'), value: r.done_name && `${r.done_name}, ${fmtDateTime(r.done_at)}${r.done_note ? `: ${r.done_note}` : ''}` },
        { label: t('Detail'), value: r.details },
      ]} />
      {(decides || doable || cancels) && <Field label={decides ? 'Note (needed to turn it down)' : 'Note (optional)'}><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>}
      <ErrorNote error={err} />
    </Sheet>
  );
}

// ── Spares ───────────────────────────────────────────────────────────────────

function Spares() {
  const { can, toast } = useApp();
  const { data, error, loading, reload } = useData('/api/it/spares');
  const [f, setF] = useState({ category: '', min: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const save = async () => {
    setBusy(true); setErr(null);
    try { await put('/api/it/spares', { category: f.category, min: Number(f.min) }); toast('Saved'); setF({ category: '', min: '' }); reload(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <>
      <Quiet icon="info">How many spare devices of each kind to keep in stock. Fewer shows on Today as a shortage.</Quiet>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.length && <Card><Quiet>No spares are watched yet.</Quiet></Card>}
      {data?.length > 0 && (
        <Card pad={false}>
          <Table caption="Spares" rows={data} rowKey={(r) => r.category} columns={[
            { key: 'category', label: 'Kind of device', primary: true },
            { key: 'min', label: 'Keep', align: 'right' },
            { key: 'inStock', label: 'In stock', align: 'right' },
            { key: 'short', label: 'Short', align: 'right', render: (r) => (r.short ? <Pill tone="warn">{r.short}</Pill> : <span className="faint">{t('none')}</span>) },
          ]} />
        </Card>
      )}
      {can('it.edit') && (
        <Card title="Keep spares">
          <div className="form two">
            <Field label="Kind of device"><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Laptop" maxLength={60} /></Field>
            <Field label="How many to keep" hint="0 stops watching it."><input type="number" min="0" inputMode="numeric" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
          </div>
          <ErrorNote error={err} />
          <div className="row" style={{ justifyContent: 'flex-end' }}><Button busy={busy} onClick={save}>Save</Button></div>
        </Card>
      )}
    </>
  );
}
