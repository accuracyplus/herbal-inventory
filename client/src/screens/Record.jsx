/**
 * The store actions with a form: record use, and transfer between stores. Receiving is Receive.jsx.
 * Each one: choose a store, add lines, check, save — and the screen says what happened.
 */

import { useEffect, useMemo, useState } from 'react';
import { post } from '../api.js';
import Icon from '../icons.jsx';
import LineEditor, { lineErrors, newLine, toPayload } from '../lines.jsx';
import { Button, Card, ErrorNote, Field, Loading, Note, Page, Select, useApp, useData } from '../ui.jsx';
import { t, tn } from '../i18n.js';

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
      <div className="row"><span className="inv-done"><Icon name="check" /></span><h2 className="grow">{t(text)}</h2></div>
      {children}
      <div className="row"><Button onClick={again}>Record another</Button></div>
    </Card>
  );
}

/** What a list of lines still needs before it can be saved, in words. */
function linesMissing(lines, errors) {
  if (!lines.length) return [t('at least one item')];
  const bad = lines.map((l, i) => (errors[l.key] ? i + 1 : 0)).filter(Boolean);
  return bad.length ? [t('a quantity this store holds on line {lines}', { lines: bad.join(t(' and ')) })] : [];
}

/** The main button stays enabled; pressed with something missing, it says what (Design Guide, forms). */
function Submit({ missing, tried, busy, icon, onPress, children }) {
  return (
    <>
      {tried && missing.length > 0 && <Note tone="warn" icon="alert" role="alert">{t('Still needed: {what}.', { what: missing.map((m) => t(m)).join(', ') })}</Note>}
      <div className="inv-submit"><Button busy={busy} onClick={onPress} icon={icon}>{children}</Button></div>
    </>
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
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  useEffect(() => { if (!storeId && stores[0]) setStoreId(stores[0].id); }, [stores, storeId]);
  useEffect(() => {
    const pre = route.query.get('item');
    if (pre && stock && !lines.length) { const it = stock.items.find((i) => i.id === pre); if (it) setLines([newLine(it)]); }
  }, [stock]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) return <Page title="Record use"><Loading /></Page>;
  if (!stores.length) return <Page title="Record use"><Note tone="warn">You are not set up to record against any store. Ask your unit administrator.</Note></Page>;
  const errors = lineErrors(lines, 'out', storeId);
  const missing = [...(needRoom && !areaId ? [t('the room or area')] : []), ...linesMissing(lines, errors)];
  const save = async () => {
    if (missing.length) { setTried(true); return; }
    setBusy(true); setErr(null);
    try {
      // "Used by" left as it is means the person recording it, as the box says.
      await post('/api/use', { storeId, areaId: areaId || null, personId: personId || (needPerson ? me.staffId : null), purpose, lines: toPayload(lines) });
      setDone({
        n: lines.length, store: stores.find((s) => s.id === storeId)?.name, area: lists.areas.find((a) => a.id === areaId)?.name,
        person: personId ? people?.find((p) => p.id === personId)?.name : (needPerson ? me.name : null),
      });
      toast('Use recorded');
      setLines([]); setPurpose(''); setPersonId(''); setTried(false);
      refreshStock(); refreshBadges();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (done) {
    const said = [
      tn(done.n, 'Recorded {n} item from {store}', 'Recorded {n} items from {store}', { store: done.store }),
      done.area ? t('for {area}', { area: done.area }) : null,
      done.person ? t('used by {person}', { person: done.person }) : null,
    ].filter(Boolean).join(', ') + '.';
    return <Page title="Record use"><Done text={said} again={() => setDone(null)} /></Page>;
  }
  return (
    <Page title="Record use" subtitle="What was used, where, and by whom.">
      <Card>
        <div className={needPerson ? 'form three' : 'form two'}>
          <Field label="Taken from"><Select value={storeId} onChange={(v) => { setStoreId(v); }} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label={needRoom ? 'Room or area' : 'Room or area (optional)'} hint={needRoom ? 'Where it was used.' : 'Where it was used. Leave empty for general use.'}
            error={tried && needRoom && !areaId ? 'Choose where it was used.' : undefined}>
            <Select value={areaId} onChange={setAreaId} placeholder={needRoom ? 'Choose a room or area' : 'Not a room'} options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} />
          </Field>
          {needPerson && (
            <Field label="Used by" hint={forOthers ? 'The person who used this stock. Left as it is, it is recorded under your name.' : 'Recorded under your name. To record for somebody else, ask the store keeper.'}>
              {forOthers
                ? <Select value={personId} onChange={setPersonId} placeholder={t('{name} (you)', { name: me.name })} options={(people || []).map((p) => ({ value: p.id, label: p.name }))} />
                : <input value={me.name} disabled />}
            </Field>
          )}
        </div>
        {needRoom && lists.areas.length === 0 && <Note tone="warn">No rooms or areas are set up yet. Ask your unit administrator to add them in Admin.</Note>}
        <ErrorNote error={peopleError} />
      </Card>
      <Card title="Items">
        <LineEditor mode="out" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} errors={errors} pickerFilter={(i) => !i.isLinen} scan="use" />
      </Card>
      <Field label="What it was for (optional)"><input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={t('Abhyanga, cleaning, a tester')} maxLength={120} /></Field>
      <ErrorNote error={err} />
      <Submit missing={missing} tried={tried} busy={busy} icon="check" onPress={save}>Record use</Submit>
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
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  useEffect(() => { if (!fromId && from[0]) setFromId(from[0].id); }, [from, fromId]);
  useEffect(() => { if (!toId || toId === fromId) setToId(lists.stores.find((s) => s.id !== fromId)?.id || ''); }, [fromId, lists.stores]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) return <Page title="Transfer"><Loading /></Page>;
  if (lists.stores.length < 2) return <Page title="Transfer"><Note>This unit has one store. Add a second store in Admin to move stock between them.</Note></Page>;
  const errors = lineErrors(lines, 'out', fromId);
  const missing = [...(!toId ? ['the store it goes to'] : []), ...linesMissing(lines, errors)];
  const save = async () => {
    if (missing.length) { setTried(true); return; }
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/transfers', { fromStoreId: fromId, toStoreId: toId, note, lines: toPayload(lines) });
      setDone(r.ref); toast(t('{ref} recorded', { ref: r.ref })); setLines([]); setNote(''); setTried(false); refreshStock();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  if (done) return <Page title="Transfer"><Done text={t('Transfer {ref} recorded.', { ref: done })} again={() => setDone(null)} /></Page>;
  return (
    <Page title="Transfer" subtitle="Move stock from one store to another. Batches keep their expiry dates.">
      <Card>
        <div className="form two">
          <Field label="From"><Select value={fromId} onChange={setFromId} options={from.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="To"><Select value={toId} onChange={setToId} options={lists.stores.filter((s) => s.id !== fromId).map((s) => ({ value: s.id, label: s.name }))} /></Field>
        </div>
      </Card>
      <Card title="Items">
        <LineEditor mode="out" items={stock.items} storeId={fromId} lines={lines} setLines={setLines} errors={errors} scan="transfer" />
      </Card>
      <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></Field>
      <ErrorNote error={err} />
      <Submit missing={missing} tried={tried} busy={busy} icon="transfer" onPress={save}>Transfer</Submit>
    </Page>
  );
}
