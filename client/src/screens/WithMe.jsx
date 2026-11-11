/**
 * Stock with people: take it, then record it as used or return it.
 *
 * "With me" is the person's own. "Team" is what is unaccounted for in the unit, person by person
 * in name order: a list to act on, not a ranking (Design Guide rule 5), so it carries no totals.
 */

import { useEffect, useState } from 'react';
import { fmtDate, fmtMoney, fmtQty, gstToday, post } from '../api.js';
import LineEditor, { lineErrors, toPayload } from '../lines.jsx';
import {
  Button, Card, ErrorNote, Field, Loading, Page, Pill, Quiet, Segmented, Select, Sheet, Stepper, Table, useApp, useData,
} from '../ui.jsx';
import { useMyStores } from './Record.jsx';
import { Bars } from './Reports.jsx';

const ageText = (h) => (h < 1 ? 'under an hour' : h < 48 ? `${h} hour${h === 1 ? '' : 's'}` : `${Math.floor(h / 24)} days`);

function Lot({ lot, onSettle }) {
  const where = [lot.store_name && `from ${lot.store_name}`, lot.area_name, lot.batch_no && `lot ${lot.batch_no}`, lot.expiry && `expires ${fmtDate(lot.expiry)}`].filter(Boolean).join(' · ');
  return (
    <li className="lot">
      <div className="min0">
        <span className="row-label">{fmtQty(lot.qty)} {lot.uom} · {lot.item_name} {lot.unaccounted && <Pill tone="warn">Unaccounted for</Pill>}</span>
        <span className="row-sub">Held {ageText(lot.ageHours)}{where ? ` · ${where}` : ''}</span>
      </div>
      <div className="lot-actions">
        <Button kind="secondary" onClick={() => onSettle(lot, 'return')}>Return</Button>
        <Button onClick={() => onSettle(lot, 'use')}>Used</Button>
      </div>
    </li>
  );
}

function Settle({ target, onClose, onDone }) {
  const { me, lists, toast, refreshStock, refreshBadges } = useApp();
  const { lot, action, forName } = target;
  const isUse = action === 'use';
  const [qty, setQty] = useState(String(lot.qty));
  const [areaId, setAreaId] = useState(lot.area_id || '');
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const needRoom = me.settings['consumption.record'] !== 'person';
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await post(`/api/custody/${action}`, { lines: [{ custodyId: lot.id, qty: Number(qty) }], areaId: areaId || null, purpose, note });
      toast(isUse ? 'Recorded as used' : `Returned to ${lot.store_name}`);
      refreshStock(); refreshBadges(); onDone();
    } catch (e) { setErr(e); setBusy(false); }
  };
  return (
    <Sheet title={lot.item_name} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>{isUse ? 'Record as used' : `Return to ${lot.store_name}`}</Button></>}>
      <div className="stack">
        <p className="muted">{fmtQty(lot.qty)} {lot.uom} {forName ? `with ${forName}` : 'with you'}, held {ageText(lot.ageHours)}.</p>
        <Field label={`How many (${lot.uom})`}><Stepper value={qty} onChange={setQty} max={lot.qty} /></Field>
        {isUse && (
          <Field label="Room or area" hint={needRoom ? 'Where it was used.' : 'Where it was used. Leave empty for general use.'}>
            <Select value={areaId} onChange={setAreaId} placeholder={needRoom ? 'Choose a room or area' : 'Not a room'} options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} />
          </Field>
        )}
        {isUse && <Field label="Purpose"><input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Optional — e.g. Abhyanga, Kizhi" maxLength={120} /></Field>}
        {forName && <Field label={`Why you are recording this for ${forName}`}><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></Field>}
        <ErrorNote error={err} />
      </div>
    </Sheet>
  );
}

function Mine() {
  const { data, error, loading, reload } = useData('/api/custody/mine');
  const [target, setTarget] = useState(null);
  const late = (data?.rows || []).filter((r) => r.unaccounted);
  const current = (data?.rows || []).filter((r) => !r.unaccounted);
  const settle = (lot, action) => setTarget({ lot, action });
  return (
    <>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.rows.length && <Quiet>Nothing with you. Stock you take shows here until it is used or returned.</Quiet>}
      {late.length > 0 && (
        <Card title="To account for" hint={`Held for more than ${data.accountHours} hours. Record it as used, or return it to the store.`}>
          <ul className="lots">{late.map((l) => <Lot key={l.id} lot={l} onSettle={settle} />)}</ul>
        </Card>
      )}
      {current.length > 0 && <Card title="With me"><ul className="lots">{current.map((l) => <Lot key={l.id} lot={l} onSettle={settle} />)}</ul></Card>}
      {target && <Settle target={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); reload(); }} />}
    </>
  );
}

function Team() {
  const { data, error, loading, reload } = useData('/api/custody/team');
  const [target, setTarget] = useState(null);
  return (
    <>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.people.length && <Quiet>Everything taken has been accounted for.</Quiet>}
      {data?.people.length > 0 && <p className="muted">Stock held for more than {data.accountHours} hours without being recorded as used or returned, listed by name.</p>}
      {data?.people.map((p) => (
        <Card key={p.personId} title={p.name}>
          <ul className="lots">{p.rows.map((l) => <Lot key={l.id} lot={l} onSettle={(lot, action) => setTarget({ lot, action, forName: p.name })} />)}</ul>
        </Card>
      ))}
      {target && <Settle target={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); reload(); }} />}
    </>
  );
}

/** A person's own use: their cost is theirs to see, and nobody else's is shown beside it. */
function MyUse() {
  const { currency } = useApp();
  const [from, setFrom] = useState(gstToday(-29));
  const [to, setTo] = useState(gstToday());
  const path = `/api/my-use?from=${from}&to=${to}`;
  const { data, error, loading, reload } = useData(path, [path]);
  return (
    <>
      <Card>
        <div className="form two">
          <Field label="From"><input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></Field>
          <Field label="To"><input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} /></Field>
        </div>
      </Card>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.byItem.length && <Quiet>You have not recorded anything as used in this period.</Quiet>}
      {data?.byItem.length > 0 && (
        <>
          <Card title="Cost of what I used" hint="At the cost of the stock when it was used or taken. Only you and your managers can see this.">
            <p className="tile-value">{fmtMoney(data.total, currency)}</p>
            <Bars rows={data.byCategory} fmt={(v) => fmtMoney(v, currency, 0)} />
          </Card>
          <Card title="What I used" pad={false}>
            <Table rows={data.byItem} rowKey={(r) => r.code} columns={[
              { key: 'name', label: 'Item', primary: true },
              { key: 'qty', label: 'Used', align: 'right', render: (r) => `${fmtQty(r.qty)} ${r.uom}` },
              { key: 'times', label: 'Times', align: 'right' },
            ]} />
          </Card>
        </>
      )}
    </>
  );
}

function Take() {
  const { me, can, stock, lists, navigate, refreshStock, refreshBadges, toast } = useApp();
  const stores = useMyStores('SUB');
  const forOthers = can('use.for_others');
  const { data: people, error: peopleError } = useData(forOthers ? '/api/people/pick' : null);
  const [storeId, setStoreId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [personId, setPersonId] = useState('');
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => { if (!storeId && stores[0]) setStoreId(stores[0].id); }, [stores, storeId]);
  const back = () => navigate('with-me');
  if (!stock) return <Page title="Take stock" back={back}><Loading /></Page>;
  if (!stores.length) return <Page title="Take stock" back={back}><div className="note warn">You are not set up to take from any store. Ask your unit administrator.</div></Page>;
  const errors = lineErrors(lines, 'out', storeId);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/custody/take', { storeId, areaId: areaId || null, personId: personId || null, lines: toPayload(lines) });
      toast(`Now with ${r.person}`);
      refreshStock(); refreshBadges(); navigate('with-me');
    } catch (e) { setErr(e); setBusy(false); }
  };
  return (
    <Page title="Take stock" subtitle="It stays with the person until it is recorded as used or returned." back={back}>
      <Card>
        <div className="form two">
          <Field label="From store"><Select value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Taken by" hint={forOthers ? 'The person who will answer for this stock.' : 'Taken in your name. To give it to somebody else, ask the store keeper.'}>
            {forOthers
              ? <Select value={personId} onChange={setPersonId} placeholder="Choose a person" options={(people || []).map((p) => ({ value: p.id, label: p.name }))} />
              : <input value={me.name} disabled />}
          </Field>
          <Field label="Room or area" className="span2" hint="Optional. It is filled in for you when the stock is recorded as used."><Select value={areaId} onChange={setAreaId} placeholder="Not a particular room" options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} /></Field>
        </div>
        <ErrorNote error={peopleError} />
      </Card>
      <Card title="Items">
        <LineEditor mode="out" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} errors={errors} pickerFilter={(i) => !i.isLinen} />
      </Card>
      <ErrorNote error={err} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button busy={busy} disabled={!lines.length || Object.keys(errors).length > 0} onClick={save} icon="custody">Take</Button>
      </div>
    </Page>
  );
}

export default function WithMe() {
  const { route, navigate, can } = useApp();
  const team = can('custody.team');
  const [tab, setTab] = useState(team && route.query.get('status') === 'TEAM' ? 'team' : 'mine');
  if (route.id === 'take') return <Take />;
  return (
    <Page title="With me" subtitle="Stock taken from the store and not yet used or returned."
      actions={<Button icon="plus" onClick={() => navigate('with-me/take')}>Take stock</Button>}>
      <Segmented label="Show" value={tab} onChange={setTab} options={[{ value: 'mine', label: 'With me' }, { value: 'used', label: 'My use' }, ...(team ? [{ value: 'team', label: 'Team' }] : [])]} />
      {tab === 'mine' && <Mine />}
      {tab === 'used' && <MyUse />}
      {tab === 'team' && <Team />}
    </Page>
  );
}
