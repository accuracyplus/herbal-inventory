/**
 * Administration: the item list, stores, rooms, people and roles, settings, the one-time import
 * from the old app, the activity log, and — for group administrators — units.
 */

import { useMemo, useState } from 'react';
import { fmtDateTime, fmtQty, post, put } from '../api.js';
import Icon from '../icons.jsx';
import {
  Button, Card, Check, ErrorNote, Field, Hint, Loading, Page, Pill, Quiet, SearchBox, Segmented, Select, Sheet, Table, useApp, useData,
} from '../ui.jsx';
import { ItemForm } from './Stock.jsx';

export default function Admin() {
  const { can, me, route } = useApp();
  const tabs = [
    can('items.edit') && ['items', 'Items'],
    can('admin') && ['stores', 'Stores'],
    can('admin') && ['areas', 'Rooms & areas'],
    can('admin') && ['people', 'People'],
    can('admin') && ['settings', 'Settings'],
    can('admin') && ['import', 'Import'],
    can('admin') && ['audit', 'Activity log'],
    me.groupAdmin && ['units', 'Units'],
  ].filter(Boolean);
  const [tab, setTab] = useState(route.query.get('tab') || tabs[0]?.[0]);
  return (
    <Page title="Admin" subtitle={`${me.unit.name}`}>
      <Segmented label="Section" value={tab} onChange={setTab} options={tabs.map(([v, l]) => ({ value: v, label: l }))} />
      {tab === 'items' && <Items />}
      {tab === 'stores' && <Stores />}
      {tab === 'areas' && <Areas />}
      {tab === 'people' && <People />}
      {tab === 'settings' && <Settings />}
      {tab === 'import' && <Import />}
      {tab === 'audit' && <Audit />}
      {tab === 'units' && <Units />}
    </Page>
  );
}

function Items() {
  const { lists } = useApp();
  const [inactive, setInactive] = useState(false);
  const { data, error, loading, reload } = useData(`/api/stock${inactive ? '?inactive=1' : ''}`, [inactive]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const rows = useMemo(() => (data?.items || []).filter((i) => !q || `${i.name} ${i.code} ${i.category}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  return (
    <>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Find an item" />
        <Check checked={inactive} onChange={setInactive}>Show retired</Check>
        <Button icon="plus" onClick={() => setEditing({})}>New item</Button>
      </div>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={rows} onRow={setEditing} empty="No items yet. Add one, or import the old app's list." columns={[
            { key: 'name', label: 'Item', primary: true, render: (i) => <span className="min0"><span className="row-label">{i.name} {!i.active && <Pill tone="faint">Retired</Pill>}</span><span className="row-sub"><code>{i.code}</code></span></span> },
            { key: 'category', label: 'Category' },
            { key: 'uom', label: 'Counted in' },
            { key: 'kind', label: 'Kind', render: (i) => (i.isLinen ? 'Linen' : i.tracksExpiry ? 'Batches & expiry' : 'Simple') },
            { key: 'levels', label: 'Levels set', render: (i) => i.stores.filter((s) => s.level).length || '—' },
            { key: 'total', label: 'Total', align: 'right', render: (i) => fmtQty(i.total) },
          ]} />
        </Card>
      )}
      {editing && <ItemForm item={editing.id ? editing : null} stores={lists.stores} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}

function SimpleList({ path, title, kinds, empty, makeBody, fields }) {
  const { toast, refreshStock } = useApp();
  const { data, error, loading, reload } = useData(`${path}?all=1`);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const body = makeBody(editing);
      if (editing.id) await put(`${path}/${editing.id}`, body); else await post(path, body);
      toast('Saved'); setEditing(null); reload(); refreshStock();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <>
      <div className="row" style={{ justifyContent: 'flex-end' }}><Button icon="plus" onClick={() => setEditing({ kind: kinds[0].value, active: 1 })}>Add</Button></div>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} onRow={(r) => setEditing({ ...r })} empty={empty} columns={[
            { key: 'name', label: title, primary: true, render: (r) => <span className="min0"><span className="row-label">{r.name} {!r.active && <Pill tone="faint">Closed</Pill>}</span><span className="row-sub"><code>{r.code}</code></span></span> },
            { key: 'kind', label: 'Kind', render: (r) => kinds.find((k) => k.value === r.kind)?.label || r.kind },
          ]} />
        </Card>
      )}
      {editing && (
        <Sheet title={editing.id ? editing.name : `New ${title.toLowerCase()}`} onClose={() => { setEditing(null); setErr(null); }}
          footer={<><Button kind="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
          <div className="form two">
            <Field label="Name"><input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Short code" hint="Letters and numbers, used in lists and exports."><input value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="Kind"><Select value={editing.kind} onChange={(v) => setEditing({ ...editing, kind: v })} options={kinds} /></Field>
            {fields?.(editing, setEditing)}
            {editing.id && <div className="span2"><Check checked={!editing.active} onChange={(v) => setEditing({ ...editing, active: v ? 0 : 1 })}>Closed — no longer in use</Check></div>}
          </div>
          <ErrorNote error={err} />
        </Sheet>
      )}
    </>
  );
}

const Stores = () => (
  <>
    <div className="note"><Icon name="stock" size={18} /><span>A <b>main store</b> receives deliveries; <b>sub stores</b> (a spa cupboard, a counter) are topped up from it through requests and transfers.</span></div>
    <SimpleList path="/api/stores" title="Store" empty="No stores yet."
      kinds={[{ value: 'MAIN', label: 'Main store' }, { value: 'SUB', label: 'Sub store' }]}
      makeBody={(e) => ({ code: e.code, name: e.name, kind: e.kind, sort: e.sort || 0, active: !!e.active })}
      fields={(e, set) => <Field label="Order in lists"><input type="number" value={e.sort ?? 0} onChange={(ev) => set({ ...e, sort: ev.target.value })} /></Field>} />
  </>
);

const Areas = () => (
  <SimpleList path="/api/areas" title="Room or area" empty="No rooms yet. Add treatment rooms, the front desk, the pharmacy counter…"
    kinds={[{ value: 'ROOM', label: 'Treatment room' }, { value: 'DESK', label: 'Front desk' }, { value: 'COUNTER', label: 'Counter' }, { value: 'OFFICE', label: 'Office' }, { value: 'OTHER', label: 'Other' }]}
    makeBody={(e) => ({ code: e.code, name: e.name, kind: e.kind, active: !!e.active })} />
);

function People() {
  const { me, lists, toast } = useApp();
  const { data, error, loading, reload } = useData('/api/people');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const roles = Object.keys(me.labels.roles);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await put('/api/people', { code: editing.code, name: editing.full_name, roles: editing.roles, stores: editing.limit ? editing.stores : null, active: editing.active !== 0 });
      toast('Saved'); setEditing(null); reload();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const toggleRole = (r) => setEditing((e) => ({ ...e, roles: e.roles.includes(r) ? e.roles.filter((x) => x !== r) : [...e.roles.filter((x) => (r === 'VIEWER' ? false : x !== 'VIEWER')), r] }));
  const toggleStore = (id) => setEditing((e) => ({ ...e, stores: e.stores.includes(id) ? e.stores.filter((x) => x !== id) : [...e.stores, id] }));
  return (
    <>
      <div className="note"><Icon name="help" size={18} /><span>People sign in with HiFive ID, and are matched by their <b>employee code</b>. Somebody HiFive ID grants Inventory to is added here automatically as {me.labels.roles.STAFF} on first sign-in.</span></div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><Button icon="plus" onClick={() => setEditing({ code: '', full_name: '', roles: ['STAFF'], stores: [], limit: false, isNew: true })}>Add a person</Button></div>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} onRow={(p) => setEditing({ ...p, limit: !!p.stores, stores: p.stores || [] })} empty="Nobody yet." columns={[
            { key: 'full_name', label: 'Person', primary: true, render: (p) => <span className="min0"><span className="row-label">{p.full_name} {!p.active && <Pill tone="faint">Removed</Pill>}</span><span className="row-sub"><code>{p.code}</code></span></span> },
            { key: 'roles', label: 'Roles', render: (p) => p.roles.map((r) => me.labels.roles[r]).join(', ') },
            { key: 'stores', label: 'Stores', render: (p) => (p.stores ? p.stores.map((id) => lists.stores.find((s) => s.id === id)?.name || '?').join(', ') : 'All') },
            { key: 'last_sign_in', label: 'Last sign-in', render: (p) => (p.last_sign_in ? fmtDateTime(p.last_sign_in) : <span className="faint">Not yet</span>) },
          ]} />
        </Card>
      )}
      {editing && (
        <Sheet title={editing.isNew ? 'Add a person' : editing.full_name} onClose={() => { setEditing(null); setErr(null); }}
          footer={<>
            {!editing.isNew && editing.active !== 0 && <Button kind="ghost" busy={busy} onClick={() => { setEditing({ ...editing, active: 0 }); }}>Remove from this unit</Button>}
            <Button kind="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button>
          </>}>
          <div className="form two">
            <Field label="HiFive ID employee code" hint="Exactly as in HiFive ID, e.g. HPAHC040. This is how sign-in finds them.">
              <input value={editing.code} disabled={!editing.isNew} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Full name"><input value={editing.full_name} disabled={!editing.isNew} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></Field>
          </div>
          <Field label="Roles in this unit">
            <div className="stack" style={{ gap: 4 }}>
              {roles.map((r) => (
                <Check key={r} checked={editing.roles.includes(r)} onChange={() => toggleRole(r)}>
                  <b>{me.labels.roles[r]}</b> <span className="muted">— {me.labels.hints[r]}</span>
                </Check>
              ))}
            </div>
          </Field>
          <Check checked={editing.limit} onChange={(v) => setEditing({ ...editing, limit: v })}>Only let them record against certain stores</Check>
          {editing.limit && (
            <div className="stack" style={{ gap: 4, paddingLeft: 30 }}>
              {lists.stores.map((s) => <Check key={s.id} checked={editing.stores.includes(s.id)} onChange={() => toggleStore(s.id)}>{s.name}</Check>)}
            </div>
          )}
          {editing.active === 0 && <div className="note warn"><Icon name="alert" size={18} />Saving will remove them from {me.unit.name}. Their records stay.</div>}
          <ErrorNote error={err} />
        </Sheet>
      )}
    </>
  );
}

function Settings() {
  const { toast, reloadMe } = useApp();
  const { data, error, loading, reload } = useData('/api/settings');
  const [vals, setVals] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const save = async () => {
    setBusy(true); setErr(null);
    try { await put('/api/settings', vals); toast('Settings saved'); setVals({}); reload(); reloadMe(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Card>
      <ErrorNote error={error} />
      {loading && <Loading />}
      {data && (
        <div className="stack">
          {data.map((s) => (
            <Field key={s.key} label={<>{s.label}<Hint text={s.hint} /></>}>
              {s.options
                ? <Select value={vals[s.key] ?? s.value} onChange={(v) => setVals({ ...vals, [s.key]: v })} options={s.options.map((o) => ({ value: o, label: o === 'none' ? 'No — straight to the store' : o === 'required' ? 'Yes — a manager approves first' : o }))} />
                : <input type="number" min={s.number[0]} max={s.number[1]} value={vals[s.key] ?? s.value} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value })} />}
            </Field>
          ))}
          <ErrorNote error={err} />
          <div className="row" style={{ justifyContent: 'flex-end' }}><Button busy={busy} disabled={!Object.keys(vals).length} onClick={save}>Save settings</Button></div>
        </div>
      )}
    </Card>
  );
}

/**
 * One-time import from the old Google Sheet app. The administrator opens the old app's data
 * link, saves what it shows as a file, and drops it here: a dry run first, then the real thing.
 */
function Import() {
  const { lists, toast, refreshStock } = useApp();
  const mains = lists.stores.filter((s) => s.kind === 'MAIN');
  const subs = lists.stores.filter((s) => s.kind === 'SUB');
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [mainId, setMainId] = useState(mains[0]?.id || '');
  const [subId, setSubId] = useState(subs[0]?.id || '');
  const [report, setReport] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const read = async (f) => {
    setErr(null); setReport(null); setFile(f);
    try {
      let text = await f.text();
      // The old app's script answers JSONP — cb({...}) — when called with a callback.
      const m = text.match(/^[\w$.]+\(([\s\S]*)\);?\s*$/);
      if (m) text = m[1];
      setData(JSON.parse(text));
    } catch { setErr(new Error('That file is not the old app\'s data. Open the link below and save the whole page.')); setData(null); }
  };
  const run = async (dryRun) => {
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/import', { data, mainStoreId: mainId, subStoreId: subId, dryRun });
      setReport(r.report);
      if (!dryRun) { setDone(true); toast('Import finished'); refreshStock(); }
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (lists.stores.length < 2) return <Card><div className="note warn"><Icon name="alert" size={18} />Set up a main store and a sub store first (Stores tab), so the old Main and Sub figures have somewhere to go.</div></Card>;
  return (
    <div className="stack">
      <Card title="1 · Get the old app's data">
        <p>Open this link in your browser. It shows everything the old Herbal Park inventory app holds. Save the page as a file (Ctrl+S, or Share → Save on a phone).</p>
        <p><code style={{ overflowWrap: 'anywhere' }}>https://script.google.com/macros/s/AKfycbxjUENJrOfdFcYLxdAqxs6ggZtxGcythH48oGiCIlx0tWIEoJBaPHJuZoQf6qFzmLg3Dg/exec?action=getAll</code></p>
      </Card>
      <Card title="2 · Choose the file and where things go">
        <div className="form two">
          <Field label="Old app's data file" className="span2"><input type="file" accept=".json,.txt,.js,application/json,text/plain" onChange={(e) => e.target.files[0] && read(e.target.files[0])} /></Field>
          <Field label="Old “Main” stock goes to"><Select value={mainId} onChange={setMainId} options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Old “Sub” stock and linen go to"><Select value={subId} onChange={setSubId} options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        </div>
        {file && data && <p className="muted">{file.name}: {(data.items || []).length} items, {(data.linen || []).length} linen, {(data.rooms || []).length} rooms, {(data.movements || []).length} history rows.</p>}
        <div className="row"><Button kind="secondary" busy={busy} disabled={!data || done} onClick={() => run(true)}>Check first (changes nothing)</Button></div>
      </Card>
      {report && (
        <Card title={done ? '3 · Imported' : '3 · What will happen'}>
          <dl className="dl">
            <dt>Items</dt><dd>{report.items} ({report.withStock} with stock)</dd>
            <dt>Linen</dt><dd>{report.linen} types, {fmtQty(report.linenPieces)} pieces</dd>
            <dt>Rooms</dt><dd>{report.rooms}</dd>
            <dt>Levels</dt><dd>{report.levels}</dd>
            <dt>Old history</dt><dd>{report.history} rows, kept for reference under Reports → Old app history</dd>
            {report.pendingRequests > 0 && <><dt>Open requests</dt><dd>{report.pendingRequests} pending in the old app are not carried over — ask staff to raise them again here.</dd></>}
          </dl>
          {report.problems.length > 0 && (
            <div className="note warn"><Icon name="alert" size={18} /><div><b>Please look at these:</b><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{report.problems.map((p) => <li key={p}>{p}</li>)}</ul></div></div>
          )}
          {report.staffToAdd.length > 0 && (
            <div className="note"><Icon name="help" size={18} /><div><b>People are not imported.</b> The old app knew names, not HiFive ID employee codes. Add these on the People tab with their codes: {report.staffToAdd.map((s) => s.name).join(', ')}.</div></div>
          )}
          {!done && <div className="row"><Button busy={busy} onClick={() => run(false)}>Import now</Button><span className="muted">Runs once. It is refused if this unit already has stock movements.</span></div>}
          {done && <Quiet>Done. Check the Stock screen against the old app before switching over.</Quiet>}
        </Card>
      )}
      <ErrorNote error={err} />
    </div>
  );
}

function Audit() {
  const [q, setQ] = useState('');
  const { data, error, loading } = useData(`/api/audit${q ? `?q=${encodeURIComponent(q)}` : ''}`, [q]);
  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="Filter by action, reference or person" />
      <ErrorNote error={error} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} rowKey={(r, i) => `${r.at}-${i}`} empty="Nothing recorded yet." columns={[
            { key: 'at', label: 'When', render: (r) => <span className="nowrap">{fmtDateTime(r.at)}</span> },
            { key: 'action', label: 'What', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.action.replace(/_/g, ' ').toLowerCase()}{r.subject ? ` · ${r.subject}` : ''}</span><span className="row-sub">{r.detail}</span></span> },
            { key: 'actor_name', label: 'By' },
          ]} />
        </Card>
      )}
    </>
  );
}

function Units() {
  const { toast, reloadMe } = useApp();
  const { data, error, loading, reload } = useData('/api/units');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const body = { code: editing.code, name: editing.name, city: editing.city, active: editing.active !== 0 };
      if (editing.id) await put(`/api/units/${editing.id}`, body); else await post('/api/units', body);
      toast('Unit saved'); setEditing(null); reload(); reloadMe();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <>
      <div className="note"><Icon name="unit" size={18} /><span>Each HiFive business is a unit with its own stores, items and people. The name must match the entity name in HiFive ID, so first sign-ins land in the right unit.</span></div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><Button icon="plus" onClick={() => setEditing({ active: 1 })}>New unit</Button></div>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <Card pad={false}>
          <Table rows={data} onRow={setEditing} columns={[
            { key: 'name', label: 'Unit', primary: true, render: (u) => <span className="min0"><span className="row-label">{u.name} {!u.active && <Pill tone="faint">Closed</Pill>}</span><span className="row-sub"><code>{u.code}</code>{u.city ? ` · ${u.city}` : ''}</span></span> },
            { key: 'stores', label: 'Stores', align: 'right' }, { key: 'items', label: 'Items', align: 'right' }, { key: 'people', label: 'People', align: 'right' },
          ]} />
        </Card>
      )}
      {editing && (
        <Sheet title={editing.id ? editing.name : 'New unit'} onClose={() => setEditing(null)}
          footer={<><Button kind="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
          <div className="form two">
            <Field label="Name, as in HiFive ID" className="span2"><input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Atomic Drugstore" /></Field>
            <Field label="Short code" hint="Starts every reference: AD-PO-0001."><input value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="AD" /></Field>
            <Field label="City"><input value={editing.city || ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} placeholder="Dubai" /></Field>
            {editing.id && <div className="span2"><Check checked={editing.active === 0} onChange={(v) => setEditing({ ...editing, active: v ? 0 : 1 })}>Closed</Check></div>}
          </div>
          {!editing.id && <p className="muted">A new unit starts with one main store. Switch to it to add people, items and more stores.</p>}
          <ErrorNote error={err} />
        </Sheet>
      )}
    </>
  );
}
