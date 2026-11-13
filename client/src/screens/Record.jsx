/**
 * The store actions with a form: record use, and transfer between stores. Receiving is Receive.jsx.
 * Each one: choose a store, add lines, check, save — and the screen says what happened.
 */

import { useEffect, useMemo, useState } from 'react';
import { post } from '../api.js';
import Icon from '../icons.jsx';
import LineEditor, { lineErrors, newLine, toPayload } from '../lines.jsx';
import { Chip, ChipGroup } from '@hifive/ui';
import { Button, Card, ErrorNote, Field, Loading, Note, Page, Segmented, Select, useApp, useData } from '../ui.jsx';
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
function Submit({ missing, tried, busy, icon, onPress, children, dock = false }) {
  return (
    <>
      {tried && missing.length > 0 && <Note tone="warn" icon="alert" role="alert">{t('Still needed: {what}.', { what: missing.map((m) => t(m)).join(', ') })}</Note>}
      <div className={dock ? 'inv-submit inv-submit--dock' : 'inv-submit'}><Button busy={busy} onClick={onPress} icon={icon}>{children}</Button></div>
    </>
  );
}

/** Rooms shown as buttons up to this many; a longer list stays a select. Twelve: Herbal Park's rooms,
 * as one tap each (Sinu, 13 Nov 2026). */
const ROOM_CHIPS = 12;

/**
 * Record use, asking only what it must (approved prototype, 13 Nov 2026): one store is said, not
 * asked; "under your name" is said, not shown as a box nobody can change; rooms are buttons with
 * the room used last already chosen; the person's usual items are one tap away; the note waits
 * behind "Add a note". Store keepers recording for somebody else keep the "Used by" box.
 */
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
  const [roomTouched, setRoomTouched] = useState(false);
  const [personId, setPersonId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  // The person's own habits in this store. If the read fails, nothing is offered and the form works as before.
  const { data: usual } = useData(storeId ? `/api/use/usual?store=${encodeURIComponent(storeId)}` : null, [storeId]);
  useEffect(() => { if (!storeId && stores[0]) setStoreId(stores[0].id); }, [stores, storeId]);
  useEffect(() => {
    const pre = route.query.get('item');
    if (pre && stock && !lines.length) { const it = stock.items.find((i) => i.id === pre); if (it) setLines([newLine(it)]); }
  }, [stock]); // eslint-disable-line react-hooks/exhaustive-deps
  // The room used last is chosen for them, until they choose one themselves.
  useEffect(() => {
    if (!roomTouched && !areaId && usual?.lastAreaId && lists.areas.some((x) => x.id === usual.lastAreaId)) setAreaId(usual.lastAreaId);
  }, [usual, roomTouched]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) return <Page title="Record use"><Loading /></Page>;
  if (!stores.length) return <Page title="Record use"><Note tone="warn">You are not set up to record against any store. Ask your unit administrator.</Note></Page>;
  const errors = lineErrors(lines, 'out', storeId);
  const missing = [...(needRoom && !areaId ? [t('the room or area')] : []), ...linesMissing(lines, errors)];
  const pickRoom = (v) => { setRoomTouched(true); setAreaId(v); };
  const save = async () => {
    if (missing.length) { setTried(true); return; }
    setBusy(true); setErr(null);
    try {
      // "Used by" left as it is means the person recording it, as the page says.
      await post('/api/use', { storeId, areaId: areaId || null, personId: personId || (needPerson ? me.staffId : null), purpose, lines: toPayload(lines) });
      setDone({
        n: lines.length, store: stores.find((s) => s.id === storeId)?.name, area: lists.areas.find((a) => a.id === areaId)?.name,
        person: personId ? people?.find((p) => p.id === personId)?.name : (needPerson ? me.name : null),
      });
      toast('Use recorded');
      // The room stays chosen for the next one: the same room is the usual case.
      setLines([]); setPurpose(''); setNoteOpen(false); setPersonId(''); setTried(false);
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

  const oneStore = stores.length === 1;
  const underName = needPerson && !forOthers;
  const store = stores.find((s) => s.id === storeId)?.name || '';
  const lede = oneStore && underName ? t('From {store}, under your name.', { store })
    : oneStore ? t('From {store}.', { store })
      : underName ? t('Recorded under your name.') : t('What was used, where, and by whom.');
  const chips = lists.areas.length > 0 && lists.areas.length <= ROOM_CHIPS;
  const roomError = tried && needRoom && !areaId ? 'Choose where it was used.' : undefined;
  const offered = (usual?.items || [])
    .map((u) => stock.items.find((i) => i.id === u.itemId))
    .filter((it) => it && !it.isLinen && !lines.some((l) => l.item.id === it.id));
  const askStore = !oneStore;
  const askPerson = needPerson && forOthers;
  return (
    <Page title="Record use" subtitle={lede}>
      {(askStore || askPerson || !chips) && (
        <Card>
          <div className="form two">
            {askStore && <Field label="Taken from"><Select value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>}
            {!chips && (
              <Field label={needRoom ? 'Room or area' : 'Room or area (optional)'} hint={needRoom ? 'Where it was used.' : 'Where it was used. Leave empty for general use.'} error={roomError}>
                <Select value={areaId} onChange={pickRoom} placeholder={needRoom ? 'Choose a room or area' : 'Not a room'} options={lists.areas.map((a) => ({ value: a.id, label: a.name }))} />
              </Field>
            )}
            {askPerson && (
              <Field label="Used by" hint="The person who used this stock. Left as it is, it is recorded under your name.">
                <Select value={personId} onChange={setPersonId} placeholder={t('{name} (you)', { name: me.name })} options={(people || []).map((p) => ({ value: p.id, label: p.name }))} />
              </Field>
            )}
          </div>
          {needRoom && lists.areas.length === 0 && <Note tone="warn">No rooms or areas are set up yet. Ask your unit administrator to add them in Admin.</Note>}
          <ErrorNote error={peopleError} />
        </Card>
      )}
      {chips && (
        <Card title={needRoom ? 'Room' : 'Room (optional)'}>
          <Segmented label={needRoom ? 'Room' : 'Room (optional)'} value={areaId} onChange={pickRoom}
            options={[...lists.areas.map((a) => ({ value: a.id, label: a.name })), ...(needRoom ? [] : [{ value: '', label: 'Not a room' }])]} />
          {roomError ? <Note tone="warn" icon="alert">{roomError}</Note>
            : usual?.lastAreaId && areaId === usual.lastAreaId && !roomTouched ? <p className="muted inv-small">{t('The room you used last is chosen for you.')}</p> : null}
        </Card>
      )}
      <Card title="Items">
        <LineEditor mode="out" items={stock.items} storeId={storeId} lines={lines} setLines={setLines} errors={errors} pickerFilter={(i) => !i.isLinen} scan="use" />
        {offered.length > 0 && (
          <div className="inv-usual">
            <p className="muted inv-small">{t('Your usual items, tap to add')}</p>
            <ChipGroup label={t('Your usual items')}>
              {offered.map((it) => (
                <Chip key={it.id} onClick={() => setLines((cur) => [...cur, newLine(it)])} aria-label={t('Add {name}', { name: it.name })}>
                  <Icon name="plus" size={16} />{it.name}
                </Chip>
              ))}
            </ChipGroup>
          </div>
        )}
        {noteOpen || purpose
          ? <Field label="What it was for (optional)"><input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={t('Abhyanga, cleaning, a tester')} maxLength={120} /></Field>
          : <div><button type="button" className="hf-btn hf-btn--quiet" onClick={() => setNoteOpen(true)}><Icon name="plus" size={16} />{t('Add a note')}</button></div>}
      </Card>
      <ErrorNote error={err} />
      <Submit missing={missing} tried={tried} busy={busy} icon="check" onPress={save} dock>Record use</Submit>
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
