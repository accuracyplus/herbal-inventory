/**
 * Services (a unit may call them treatments, or tests): record one, and its recipe comes off the
 * shelf in one go. Managers keep the recipes: what each normally uses.
 *
 * The recipe fills the form; the person can still change a quantity, take out what was not used
 * or add something else. Both the recipe and what was used are kept, for the report.
 */

import { useEffect, useMemo, useState } from 'react';
import { fmtAgo, fmtMoney, fmtQty, post, put } from '../api.js';
import Icon from '../icons.jsx';
import LineEditor, { lineErrors, newLine, toPayload } from '../lines.jsx';
import {
  Button, Card, Check, ErrorNote, Field, Loading, Note, Page, Pill, Quiet, Segmented, Select, Sheet, StatusRows, Stepper, Table, useApp, useData,
} from '../ui.jsx';
import { useMyStores } from './Record.jsx';
import ServiceLink from './ServiceLink.jsx';

export const ONE = { Services: 'service', Treatments: 'treatment', Tests: 'test' };

export default function Services() {
  const { me, can } = useApp();
  const word = me.settings['services.word'] || 'Services';
  const edits = can('services.edit');
  const records = can('stock.use');
  const { route } = useApp();
  const asked = route.query.get('tab');
  const [tab, setTab] = useState(edits && ['recipes', 'link'].includes(asked) ? asked : records ? 'record' : 'recipes');
  const { data, error, loading, reload } = useData(`/api/services${edits ? '?all=1' : ''}`);
  return (
    <Page title={word} subtitle={`Record a ${ONE[word]} and what it normally uses comes off the shelf together.`}>
      {edits && <Segmented label="Section" value={tab} onChange={setTab} options={[
        ...(records ? [{ value: 'record', label: `Record a ${ONE[word]}` }] : []), { value: 'recipes', label: 'Recipes' }, { value: 'link', label: 'From bookings or billing' },
      ]} />}
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && tab === 'record' && <Record services={data.filter((s) => s.active)} word={word} onRecipes={edits ? () => setTab('recipes') : null} />}
      {data && tab === 'recipes' && <Recipes services={data} word={word} reload={reload} />}
      {tab === 'link' && edits && <ServiceLink word={word} />}
    </Page>
  );
}

function Record({ services, word, onRecipes }) {
  const { me, can, stock, lists, refreshStock, refreshBadges, toast } = useApp();
  const stores = useMyStores('SUB');
  const mode = me.settings['consumption.record'] || 'both';
  const needRoom = mode !== 'person';
  const needPerson = mode !== 'room';
  const forOthers = can('use.for_others');
  const { data: people, error: peopleError } = useData(needPerson && forOthers ? '/api/people/pick' : null);
  const recent = useData('/api/service-records');
  const [serviceId, setServiceId] = useState('');
  const [times, setTimes] = useState('1');
  const [storeId, setStoreId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [personId, setPersonId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  const one = ONE[word];
  const svc = services.find((s) => s.id === serviceId);
  const n = Number(times);
  useEffect(() => { if (!storeId && stores[0]) setStoreId(stores[0].id); }, [stores, storeId]);

  // Choosing what was done, or how many, lays the recipe out again.
  const standard = useMemo(() => new Map((svc && Number.isInteger(n) && n > 0 ? svc.items : []).map((i) => [i.itemId, +(i.qty * n).toFixed(3)])), [svc, n]);
  useEffect(() => {
    if (!stock) return;
    setLines([...standard].map(([itemId, qty]) => { const it = stock.items.find((i) => i.id === itemId); return it ? newLine(it, { qty: String(qty) }) : null; }).filter(Boolean));
  }, [standard, stock]);

  if (!stock) return <Loading />;
  if (!services.length) {
    return (
      <Card><Quiet icon="help">No {word.toLowerCase()} are set up yet.{onRecipes ? '' : ' A manager adds them, with what each normally uses.'}</Quiet>
        {onRecipes && <div className="row"><Button icon="plus" onClick={onRecipes}>Set up the first one</Button></div>}</Card>
    );
  }
  if (!stores.length) return <Note tone="warn">You are not set up to record against any store. Ask your unit administrator.</Note>;

  // What differs from the recipe, in words, before it is saved.
  const used = new Map(lines.map((l) => [l.item.id, Number(l.qty) || 0]));
  const differs = [
    ...[...standard].filter(([id, q]) => (used.get(id) || 0) !== q).map(([id, q]) => {
      const it = stock.items.find((i) => i.id === id);
      return used.get(id) ? `${it?.name}: ${fmtQty(used.get(id))} ${it?.uom}, the recipe says ${fmtQty(q)}` : `${it?.name}: not used (the recipe says ${fmtQty(q)} ${it?.uom})`;
    }),
    ...lines.filter((l) => !standard.has(l.item.id) && Number(l.qty) > 0).map((l) => `${l.item.name}: ${fmtQty(l.qty)} ${l.item.uom}, not in the recipe`),
  ];
  const errors = lineErrors(lines, 'out', storeId);
  const save = async () => {
    if (!svc) { setErr(new Error(`Choose the ${one} that was done.`)); return; }
    if (Object.keys(errors).length) { setErr(new Error('Some lines need attention: see the lines marked below.')); return; }
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/service-records', { serviceId, times: n, storeId, areaId: areaId || null, personId: personId || null, note, lines: toPayload(lines) });
      setDone(r); toast(`${r.ref} recorded`);
      setServiceId(''); setTimes('1'); setNote(''); setPersonId('');
      refreshStock(); refreshBadges(); recent.reload();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <Card>
        <div className="row"><span className="inv-done"><Icon name="check" /></span><h2 className="grow">{done.ref}: {done.times} × {done.name} recorded.</h2></div>
        <p className="muted">{done.differs ? 'What was used differs from the recipe. Both are kept, and the report shows the difference.' : 'Used exactly as the recipe says.'}</p>
        <div className="row"><Button onClick={() => setDone(null)}>Record another</Button></div>
      </Card>
    );
  }
  return (
    <>
      <Card>
        <div className="form two">
          <Field label={`Which ${one}`}><Select value={serviceId} onChange={setServiceId} placeholder="Choose" options={services.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="How many were done"><Stepper value={times} onChange={setTimes} /></Field>
          <Field label="From store"><Select value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Room or area" hint={needRoom ? 'Where it was done.' : 'Where it was done. Leave empty if it does not apply.'}>
            <Select value={areaId} onChange={setAreaId} placeholder={needRoom ? 'Choose a room or area' : 'Not a room'} options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} />
          </Field>
          {needPerson && (
            <Field label="Done by" hint={forOthers ? 'The person who did it.' : 'Recorded under your name. To record for somebody else, ask the store keeper.'}>
              {forOthers
                ? <Select value={personId} onChange={setPersonId} placeholder="Choose a person" options={(people || []).map((p) => ({ value: p.id, label: p.name }))} />
                : <input value={me.name} disabled />}
            </Field>
          )}
          <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" maxLength={300} /></Field>
        </div>
        <ErrorNote error={peopleError} />
      </Card>
      {svc && (
        <Card title="What it used" hint="Laid out from the recipe. Change a quantity, remove what was not used, or add something else that was.">
          <LineEditor mode="out" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} errors={errors} pickerFilter={(i) => !i.isLinen} />
          {differs.length > 0 && (
            <Note icon="help"><div><b>Differs from the recipe</b><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{differs.map((d) => <li key={d}>{d}</li>)}</ul></div></Note>
          )}
        </Card>
      )}
      <ErrorNote error={err} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button busy={busy} onClick={save} icon="check">Record</Button>
      </div>
      {recent.data?.length > 0 && (
        <Card title="Recorded lately">
          <StatusRows rows={recent.data.slice(0, 8).map((r) => ({
            key: r.id, icon: 'sparkle', tone: 'brand', label: <>{r.times} × {r.service_name} {r.differences > 0 && <Pill tone="faint">differs from the recipe</Pill>}</>,
            sub: [r.ref, r.area_name, r.person_name, fmtAgo(r.at)].filter(Boolean).join(' · '),
          }))} />
        </Card>
      )}
    </>
  );
}

function Recipes({ services, word, reload }) {
  const { stock, can, currency, toast } = useApp();
  const [editing, setEditing] = useState(null);
  const one = ONE[word];
  return (
    <>
      <Note icon="help"><span>A recipe is what one {one} normally uses. It fills in the form when a {one} is recorded, and it is what actual use is compared with. Changing it does not change what was already recorded.</span></Note>
      <div className="row" style={{ justifyContent: 'flex-end' }}><Button icon="plus" onClick={() => setEditing({ code: '', name: '', items: [], active: 1 })}>New {one}</Button></div>
      <Card pad={false}>
        <Table rows={services} onRow={setEditing} empty={`No ${word.toLowerCase()} yet. Add one with what it normally uses.`} columns={[
          { key: 'name', label: word.replace(/s$/, ''), primary: true, render: (s) => <span className="min0"><span className="row-label">{s.name} {!s.active && <Pill tone="faint">No longer offered</Pill>}</span><span className="row-sub"><code>{s.code}</code></span></span> },
          { key: 'items', label: 'Normally uses', sortable: false, render: (s) => s.items.map((i) => `${fmtQty(i.qty)} ${i.uom} ${i.name}`).join(', ') },
          ...(can('cost.view') ? [
            { key: 'stdCost', label: 'Cost of one', align: 'right', render: (s) => fmtMoney(s.stdCost, currency) },
            { key: 'price', label: 'Usual price', align: 'right', render: (s) => (s.price === null || s.price === undefined ? <span className="faint">not set</span> : fmtMoney(s.price, currency)) },
            { key: 'margin', label: 'Margin', align: 'right', render: (s) => (s.margin === undefined ? '' : fmtMoney(s.margin, currency)) },
          ] : []),
        ]} />
      </Card>
      {editing && stock && <RecipeSheet s={editing} one={one} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast('Saved'); reload(); }} />}
    </>
  );
}

function RecipeSheet({ s, one, onClose, onSaved }) {
  const { stock } = useApp();
  const [f, setF] = useState({ code: s.code, name: s.name, price: s.price ?? '', active: s.active !== 0 });
  const [lines, setLines] = useState(() => s.items.map((i) => { const it = stock.items.find((x) => x.id === i.itemId); return it ? newLine(it, { qty: String(i.qty) }) : null; }).filter(Boolean));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const gone = s.items.filter((i) => i.retired);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const body = { code: f.code, name: f.name, price: f.price === '' ? null : f.price, active: f.active, items: toPayload(lines) };
      if (s.id) await put(`/api/services/${s.id}`, body); else await post('/api/services', body);
      onSaved();
    } catch (e) { setErr(e); setBusy(false); }
  };
  return (
    <Sheet wide title={s.id ? s.name : `New ${one}`} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
      <div className="form two">
        <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Abhyanga" maxLength={80} /></Field>
        <Field label="Short code" hint="Letters and numbers, used in lists and exports. A booking or billing system names the service by this."><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="ABH" maxLength={20} /></Field>
        <Field label="Usual price (optional)" hint="What one is charged at. Used for the margin when a service is recorded with no price of its own."><input type="number" min="0" step="any" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
      </div>
      <Card title={`What one ${one} normally uses`} hint="In each item's own unit. Part of a bottle is a decimal: a quarter of a bottle is 0.25.">
        <LineEditor mode="request" items={stock.items} lines={lines} setLines={setLines} pickerFilter={(i) => !i.isLinen} />
      </Card>
      {gone.length > 0 && <Note tone="warn" icon="alert"><span>{gone.map((i) => i.name).join(', ')} {gone.length === 1 ? 'has' : 'have'} been retired and {gone.length === 1 ? 'is' : 'are'} left out. Saving removes {gone.length === 1 ? 'it' : 'them'} from this recipe.</span></Note>}
      {s.id && <Check checked={!f.active} onChange={(v) => setF({ ...f, active: !v })}>No longer offered: it cannot be recorded, and stays in the reports</Check>}
      <ErrorNote error={err} />
    </Sheet>
  );
}
