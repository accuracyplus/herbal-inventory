/**
 * The store actions with a form: record use, and transfer between stores. Receiving is Receive.jsx.
 * Each one: choose a store, add lines, check, save — and the screen says what happened.
 */

import { useEffect, useMemo, useState } from 'react';
import { post } from '../api.js';
import Icon from '../icons.jsx';
import LineEditor, { lineErrors, newLine, toPayload } from '../lines.jsx';
import { Button, Card, ErrorNote, Field, Loading, Page, Select, useApp, useData } from '../ui.jsx';

/** The stores this person may record against, the sub stores first for use. */
export function useMyStores(prefer) {
  const { lists } = useApp();
  return useMemo(() => {
    const mine = lists.stores.filter((s) => s.mine);
    return prefer ? [...mine.filter((s) => s.kind === prefer), ...mine.filter((s) => s.kind !== prefer)] : mine;
  }, [lists.stores, prefer]);
}

function Done({ text, again, children }) {
  return (
    <Card>
      <div className="row"><span className="row-icon tone-ok"><Icon name="check" /></span><h2 className="grow">{text}</h2></div>
      {children}
      <div className="row"><Button onClick={again}>Record another</Button></div>
    </Card>
  );
}

export function UseScreen() {
  const { me, can, stock, lists, route, refreshStock, refreshBadges, toast } = useApp();
  const stores = useMyStores('SUB');
  const mode = me.settings['consumption.record'] || 'both';
  const needRoom = mode !== 'person';
  const needPerson = mode !== 'room';
  const forOthers = can('use.for_others');
  const { data: people, error: peopleError } = useData(needPerson && forOthers ? '/api/people/pick' : null);
  const [storeId, setStoreId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [personId, setPersonId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  useEffect(() => { if (!storeId && stores[0]) setStoreId(stores[0].id); }, [stores, storeId]);
  useEffect(() => {
    const pre = route.query.get('item');
    if (pre && stock && !lines.length) { const it = stock.items.find((i) => i.id === pre); if (it) setLines([newLine(it)]); }
  }, [stock]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) return <Page title="Record use"><Loading /></Page>;
  if (!stores.length) return <Page title="Record use"><div className="note warn">You are not set up to record against any store. Ask your unit administrator.</div></Page>;
  const errors = lineErrors(lines, 'out', storeId);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await post('/api/use', { storeId, areaId: areaId || null, personId: personId || null, purpose, lines: toPayload(lines) });
      setDone({
        n: lines.length, store: stores.find((s) => s.id === storeId)?.name, area: lists.areas.find((a) => a.id === areaId)?.name,
        person: personId ? people?.find((p) => p.id === personId)?.name : (needPerson ? me.name : null),
      });
      toast('Use recorded');
      setLines([]); setPurpose(''); setPersonId('');
      refreshStock(); refreshBadges();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (done) return <Page title="Record use"><Done text={`Recorded ${done.n} item${done.n > 1 ? 's' : ''} from ${done.store}${done.area ? ` for ${done.area}` : ''}${done.person ? ` · used by ${done.person}` : ''}.`} again={() => setDone(null)} /></Page>;
  return (
    <Page title="Record use" subtitle="What was taken from the shelf, where it went, and who used it.">
      <Card>
        <div className="form two">
          <Field label="From store"><Select value={storeId} onChange={(v) => { setStoreId(v); }} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Room or area" hint={needRoom ? 'Where it was used.' : 'Where it was used. Leave empty for general use.'}>
            <Select value={areaId} onChange={setAreaId} placeholder={needRoom ? 'Choose a room or area' : 'Not a room'} options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} />
          </Field>
          {needPerson && (
            <Field label="Used by" hint={forOthers ? 'The person who used this stock.' : 'Recorded under your name. To record for somebody else, ask the store keeper.'}>
              {forOthers
                ? <Select value={personId} onChange={setPersonId} placeholder="Choose a person" options={(people || []).map((p) => ({ value: p.id, label: p.name }))} />
                : <input value={me.name} disabled />}
            </Field>
          )}
          <Field label="Purpose" className={needPerson ? '' : 'span2'}><input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Optional — e.g. Abhyanga, Kizhi, cleaning, tester" maxLength={120} /></Field>
        </div>
        {needRoom && lists.areas.length === 0 && <div className="note warn">No rooms or areas are set up yet. Ask your unit administrator to add them in Admin.</div>}
        <ErrorNote error={peopleError} />
      </Card>
      <Card title="Items">
        <LineEditor mode="out" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} errors={errors} pickerFilter={(i) => !i.isLinen} scan="use" />
      </Card>
      <ErrorNote error={err} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button busy={busy} disabled={!lines.length || Object.keys(errors).length > 0} onClick={save} icon="check">Record use</Button>
      </div>
    </Page>
  );
}

export function TransferScreen() {
  const { stock, lists, refreshStock, toast } = useApp();
  const from = useMyStores('MAIN');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  useEffect(() => { if (!fromId && from[0]) setFromId(from[0].id); }, [from, fromId]);
  useEffect(() => { if (!toId || toId === fromId) setToId(lists.stores.find((s) => s.id !== fromId)?.id || ''); }, [fromId, lists.stores]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) return <Page title="Transfer"><Loading /></Page>;
  if (lists.stores.length < 2) return <Page title="Transfer"><div className="note">This unit has one store. Add a second store in Admin to move stock between them.</div></Page>;
  const errors = lineErrors(lines, 'out', fromId);
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/transfers', { fromStoreId: fromId, toStoreId: toId, note, lines: toPayload(lines) });
      setDone(r.ref); toast(`${r.ref} recorded`); setLines([]); setNote(''); refreshStock();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (done) return <Page title="Transfer"><Done text={`Transfer ${done} recorded.`} again={() => setDone(null)} /></Page>;
  return (
    <Page title="Transfer" subtitle="Move stock from one store to another. Batches keep their expiry dates.">
      <Card>
        <div className="form two">
          <Field label="From"><Select value={fromId} onChange={setFromId} options={from.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="To"><Select value={toId} onChange={setToId} options={lists.stores.filter((s) => s.id !== fromId).map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Note" className="span2"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" maxLength={300} /></Field>
        </div>
      </Card>
      <Card title="Items">
        <LineEditor mode="out" items={stock.items} storeId={fromId} lines={lines} setLines={setLines} errors={errors} scan="transfer" />
      </Card>
      <ErrorNote error={err} />
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button busy={busy} disabled={!lines.length || !toId || Object.keys(errors).length > 0} onClick={save} icon="transfer">Transfer</Button>
      </div>
    </Page>
  );
}
