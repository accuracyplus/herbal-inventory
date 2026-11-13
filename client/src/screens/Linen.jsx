/**
 * Linen: clean on the shelf → out in rooms → at the laundry → back on the shelf.
 * One card per item and store, with the next move one tap away.
 */

import { useState } from 'react';
import { fmtAgo, fmtDateTime, fmtQty, post } from '../api.js';
import Icon from '../icons.jsx';
import { Button, Card, ErrorNote, Field, Loading, Page, Quiet, Select, Sheet, Stepper, Table, useApp, useData } from '../ui.jsx';
import { t } from '../i18n.js';

const FLOWS = {
  ISSUE: { label: 'Send to a room', from: 'available', icon: 'use' },
  WASH: { label: 'Send to the laundry', from: 'in_use', icon: 'linen' },
  RETURN: { label: 'Back from the laundry', from: 'in_wash', icon: 'check' },
  BACK: { label: 'Back unused from a room', from: 'in_use', icon: 'back' },
  REWASH: { label: 'Shelf to laundry', from: 'available', icon: 'linen' },
  DISCARD: { label: 'Discard (worn or torn)', from: null, icon: 'trash' },
};
const STATE = { available: 'clean on the shelf', in_use: 'in rooms', in_wash: 'at the laundry' };

export default function Linen() {
  const { can, lists, refreshStock, toast, navigate } = useApp();
  const { data, error, loading, reload } = useData('/api/linen');
  const [move, setMove] = useState(null);

  return (
    <Page title="Linen" subtitle="Towels, sheets and robes: where every piece is right now.">
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.rows.length && (
        <Card>
          <Quiet icon="linen">No linen is held yet.</Quiet>
          {can('receive') && <p className="muted">{t('Add linen as an item marked “This is linen”, then receive the pieces into a store.')}</p>}
          {can('items.edit') && <div><Button kind="secondary" onClick={() => navigate('admin')}>Go to items</Button></div>}
        </Card>
      )}
      {data && data.rows.length > 0 && (
        <div className="grid3">
          {data.rows.map((r) => (
            <Card key={`${r.id}-${r.store_id}`} title={r.store_name}>
              <h2>{r.name}</h2>
              <div className="linen-states">
                <div><b>{fmtQty(r.available)}</b><span>{t('clean')}</span></div>
                <div><b>{fmtQty(r.in_use)}</b><span>{t('in rooms')}</span></div>
                <div><b>{fmtQty(r.in_wash)}</b><span>{t('laundry')}</span></div>
              </div>
              {r.in_wash > 0 && <p className="muted" style={{ fontSize: 13 }}>{t('Last back from the laundry: {when}', { when: r.last_back ? fmtAgo(r.last_back) : t('never') })}</p>}
              {can('stock.use') && (
                <div className="row">
                  <Button kind="secondary" disabled={!r.available} onClick={() => setMove({ row: r, flow: 'ISSUE' })}>To room</Button>
                  <Button kind="secondary" disabled={!r.in_use} onClick={() => setMove({ row: r, flow: 'WASH' })}>To laundry</Button>
                  <Button kind="secondary" disabled={!r.in_wash} onClick={() => setMove({ row: r, flow: 'RETURN' })}>Back clean</Button>
                  <button className="icon-btn" aria-label={t('More for {name}', { name: r.name })} onClick={() => setMove({ row: r, flow: null })}><Icon name="more" size={18} /></button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {data && data.recent.length > 0 && (
        <Card title="Recent linen movements" pad={false}>
          <Table columns={[
            { key: 'at', label: 'When', render: (m) => <span className="nowrap">{fmtDateTime(m.at)}</span> },
            { key: 'name', label: 'Item', primary: true, render: (m) => `${fmtQty(m.qty)} × ${m.name}` },
            { key: 'move', label: 'Move', render: (m) => `${STATE[m.from_state] ? t(STATE[m.from_state]) : m.from_state} → ${m.to_state === 'gone' ? t('discarded') : t(STATE[m.to_state])}${m.area_name ? ` (${m.area_name})` : ''}${m.reason ? `: ${m.reason}` : ''}` },
            { key: 'actor_name', label: 'By' },
          ]} rows={data.recent} rowKey={(m, i) => `${m.at}-${i}`} />
        </Card>
      )}
      {move && <MoveSheet move={move} areas={lists.areas} onClose={() => setMove(null)} onDone={() => { setMove(null); reload(); refreshStock(); toast('Linen updated'); }} />}
    </Page>
  );
}

function MoveSheet({ move, areas, onClose, onDone }) {
  const [flow, setFlow] = useState(move.flow || 'BACK');
  const [qty, setQty] = useState('1');
  const [areaId, setAreaId] = useState('');
  const [from, setFrom] = useState('in_use');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const r = move.row;
  const src = flow === 'DISCARD' ? from : FLOWS[flow].from;
  const max = r[src];
  const save = async () => {
    if (!(Number(qty) > 0) || Number(qty) > max) { setErr(new Error(t('Still needed: how many pieces, from 1 to {max}.', { max }))); return; }
    setBusy(true); setErr(null);
    try {
      await post('/api/linen', { storeId: r.store_id, itemId: r.id, flow, qty: Number(qty), areaId: areaId || null, from, reason });
      onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={`${r.name}, ${r.store_name}`} onClose={onClose}
      footer={<><Button kind="secondary" onClick={onClose}>Cancel</Button><Button busy={busy} onClick={save}>Save</Button></>}>
      {!move.flow && (
        <Field label="What is happening">
          <Select value={flow} onChange={setFlow} options={Object.entries(FLOWS).map(([k, f]) => ({ value: k, label: f.label }))} />
        </Field>
      )}
      {move.flow && <p className="muted">{t(FLOWS[flow].label)}.</p>}
      {flow === 'DISCARD' && (
        <>
          <Field label="Where are the pieces now"><Select value={from} onChange={setFrom} options={Object.entries(STATE).map(([k, l]) => ({ value: k, label: l }))} /></Field>
          <Field label="Why"><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Torn, stained beyond washing, lost at laundry…')} maxLength={120} /></Field>
        </>
      )}
      {flow === 'ISSUE' && <Field label="Room"><Select value={areaId} onChange={setAreaId} placeholder="Not a particular room" options={areas.map((a) => ({ value: a.id, label: a.name }))} /></Field>}
      <Field label={t('How many ({n} {where})', { n: fmtQty(max), where: t(STATE[src]) })}><Stepper value={qty} onChange={setQty} max={max} /></Field>
      <ErrorNote error={err} />
    </Sheet>
  );
}
