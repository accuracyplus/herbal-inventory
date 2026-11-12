/**
 * Scanning on a phone.
 *
 *   #/scan/<pairing>   paired with a computer: each scan goes to the list open there
 *   #/scan             walking the store: see what each item is and where it is, keep a list,
 *                      then take the list to Record use, Take, Request, Transfer or Receive
 */

import { useEffect, useState } from 'react';
import { fmtQty, get, post } from '../api.js';
import Icon from '../icons.jsx';
import { Button, Card, ErrorNote, Loading, Note, Page, Quiet, Stepper, useApp } from '../ui.jsx';
import Camera from '../scan/Camera.jsx';
import WhichItem from '../scan/WhichItem.jsx';
import { giveHandoff } from '../scan/handoff.js';

const FOR = { use: 'Record use', take: 'Take stock', transfer: 'Transfer', receive: 'Receive a delivery', request: 'A request', count: 'A stock count' };

export default function Scan() {
  const { route } = useApp();
  return route.id ? <Paired id={route.id} /> : <Walk />;
}

function Paired({ id }) {
  const { navigate } = useApp();
  const [info, setInfo] = useState(null);
  const [ended, setEnded] = useState(false);
  const [err, setErr] = useState(null);
  const [unknown, setUnknown] = useState(null);
  const [sent, setSent] = useState([]);
  useEffect(() => {
    post(`/api/scan/sessions/${id}/pair`).then(setInfo).catch((e) => { if (e.status === 410) setEnded(true); else setErr(e); });
  }, [id]);
  const send = async (barcode, itemId) => {
    setErr(null);
    try {
      const r = await post(`/api/scan/sessions/${id}/scans`, { barcode, ...(itemId ? { itemId } : {}) });
      if (!r.known) { setUnknown(barcode); return; }
      setSent((s) => {
        const i = s.findIndex((x) => x.id === r.item.id);
        return i < 0 ? [{ ...r.item, n: 1 }, ...s] : s.map((x, j) => (j === i ? { ...x, n: x.n + 1 } : x));
      });
    } catch (e) { if (e.status === 410) setEnded(true); else setErr(e); }
  };
  const total = sent.reduce((t, x) => t + x.n, 0);
  return (
    <Page title="Scanning for your computer" subtitle={info ? `${FOR[info.purpose] || 'A list'} · ${info.unitName}` : undefined}
      actions={<Button kind="secondary" onClick={() => navigate('today')}>Finish</Button>}>
      <ErrorNote error={err} />
      {ended && <Note tone="warn" icon="clock">This pairing has ended. Press Scan with phone on the computer again and scan the new code.</Note>}
      {!info && !ended && !err && <Loading what="Connecting to your computer" />}
      {info && !ended && (
        <>
          <Camera onCode={(code) => send(code)} paused={!!unknown} />
          {unknown && <WhichItem barcode={unknown} onCancel={() => setUnknown(null)} onPicked={(item) => { setUnknown(null); send(unknown, item.id); }} />}
          <Card title={total ? `Sent to the computer · ${total}` : 'Sent to the computer'}>
            {sent.length
              ? <ul className="tally">{sent.map((x) => <li key={x.id}><Icon name="check" size={16} /><span className="grow">{x.name}</span><b>{x.n > 1 ? `×${x.n}` : ''}</b></li>)}</ul>
              : <Quiet icon="scan">Scan an item. It appears on the computer's list within a second or two.</Quiet>}
          </Card>
        </>
      )}
    </Page>
  );
}

function Walk() {
  const { stock, lists, can, navigate } = useApp();
  const [list, setList] = useState([]);
  const [last, setLast] = useState(null);
  const [unknown, setUnknown] = useState(null);
  const [err, setErr] = useState(null);
  const addOne = (item) => {
    setLast(item);
    setList((l) => {
      const i = l.findIndex((x) => x.item.id === item.id);
      return i < 0 ? [{ item, qty: '1' }, ...l] : l.map((x, j) => (j === i ? { ...x, qty: String((Number(x.qty) || 0) + 1) } : x));
    });
  };
  const onCode = async (code) => {
    setErr(null);
    try {
      const hit = await get(`/api/lookup?code=${encodeURIComponent(code)}`);
      const item = stock?.items.find((i) => i.id === hit.id);
      if (item) addOne(item);
    } catch (e) { if (e.status === 404) setUnknown(code); else setErr(e); }
  };
  if (!stock) return <Page title="Scan"><Loading /></Page>;
  const goes = [
    can('stock.use') && ['use', 'Record use', 'use'],
    can('stock.use') && ['take', 'Take', 'with-me/take'],
    can('request.create') && ['request', 'Request', 'requests?new=scan'],
    can('transfer') && ['transfer', 'Transfer', 'transfer'],
    can('receive') && ['receive', 'Receive', 'receive'],
  ].filter(Boolean);
  const go = ([key, , to]) => {
    giveHandoff(key, list.filter((x) => Number(x.qty) > 0).map((x) => ({ itemId: x.item.id, qty: Number(x.qty) })));
    navigate(to);
  };
  const storeName = (id) => lists.stores.find((s) => s.id === id)?.name || 'Store';
  return (
    <Page title="Scan" subtitle="Walk the store: scan to see what an item is and where it is, and keep a list to act on.">
      <Camera onCode={onCode} paused={!!unknown} />
      {unknown && <WhichItem barcode={unknown} onCancel={() => setUnknown(null)} onPicked={(item) => { setUnknown(null); addOne(item); }} />}
      <ErrorNote error={err} />
      {last && (
        <Card title={last.name}>
          <p className="muted"><code>{last.code}</code> · {last.category}</p>
          <dl className="hf-kv hf-kv--3">
            {last.stores.filter((s) => s.held).map((s) => (
              <div key={s.storeId}><dt>{storeName(s.storeId)}</dt><dd>{fmtQty(s.qty)} {last.uom}</dd>{s.withPeople > 0 && <span className="row-sub">{fmtQty(s.withPeople)} with people</span>}</div>
            ))}
          </dl>
          <div className="row"><Button kind="ghost" icon="stock" onClick={() => navigate(`stock/${last.id}`)}>Open the item</Button></div>
        </Card>
      )}
      <Card title={list.length ? `Scanned · ${list.length} item${list.length === 1 ? '' : 's'}` : 'Scanned'}
        actions={list.length > 0 && <Button kind="ghost" onClick={() => { setList([]); setLast(null); }}>Clear</Button>}>
        {!list.length && <Quiet icon="scan">Nothing scanned yet.</Quiet>}
        <div className="lines">
          {list.map((x) => (
            <div key={x.item.id} className="line">
              <div className="min0"><div className="line-name">{x.item.name}</div><div className="line-sub"><code>{x.item.code}</code></div></div>
              <button className="icon-btn" onClick={() => setList((l) => l.filter((y) => y.item.id !== x.item.id))} aria-label={`Remove ${x.item.name}`}><Icon name="trash" size={18} /></button>
              <div className="line-fields"><Stepper value={x.qty} onChange={(v) => setList((l) => l.map((y) => (y.item.id === x.item.id ? { ...y, qty: v } : y)))} /></div>
            </div>
          ))}
        </div>
        {list.length > 0 && goes.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <span className="muted">Take this list to</span>
            <div className="scan-row">{goes.map((g) => <Button key={g[0]} kind="secondary" onClick={() => go(g)}>{g[1]}</Button>)}</div>
          </div>
        )}
      </Card>
    </Page>
  );
}
