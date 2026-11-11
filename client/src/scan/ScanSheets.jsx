/**
 * The two ways to scan into a list on screen:
 *   ScanSheet   this device's own camera (a phone, or a laptop's)
 *   PairSheet   a QR code for the same person's phone; its scans arrive here every second or so
 *
 * Both call onItem(item) once per scan. It returns false when the item cannot go on this list,
 * and the sheet says so.
 */

import { useEffect, useRef, useState } from 'react';
import { fmtDateTime, get, post } from '../api.js';
import { Button, ErrorNote, Sheet, useApp } from '../ui.jsx';
import Icon from '../icons.jsx';
import Camera from './Camera.jsx';
import WhichItem from './WhichItem.jsx';

/** Desks get "Scan with phone" as well; a phone just uses its own camera. */
export const isDesk = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;

function useTally() {
  const [tally, setTally] = useState([]);
  const add = (item, ok) => setTally((t) => {
    const i = t.findIndex((x) => x.id === item.id && x.ok === ok);
    if (i < 0) return [{ id: item.id, name: item.name, n: 1, ok }, ...t].slice(0, 6);
    return t.map((x, j) => (j === i ? { ...x, n: x.n + 1 } : x));
  });
  return [tally, add];
}

function Tally({ rows }) {
  if (!rows.length) return null;
  return (
    <ul className="tally">
      {rows.map((r) => (
        <li key={`${r.id}-${r.ok}`} className={r.ok ? '' : 'tone-txt-CRITICAL'}>
          <Icon name={r.ok ? 'check' : 'alert'} size={16} />
          <span className="grow">{r.name}{r.ok ? '' : ' — not on this list'}</span>
          <b>{r.n > 1 ? `×${r.n}` : ''}</b>
        </li>
      ))}
    </ul>
  );
}

export function ScanSheet({ onItem, onClose, filter }) {
  const { stock } = useApp();
  const [unknown, setUnknown] = useState(null);
  const [err, setErr] = useState(null);
  const [tally, add] = useTally();
  const give = (item) => add(item, onItem(item) !== false);
  const onCode = async (code) => {
    setErr(null);
    try {
      const hit = await get(`/api/lookup?code=${encodeURIComponent(code)}`);
      give(stock.items.find((i) => i.id === hit.id) || hit);
    } catch (e) {
      if (e.status === 404) setUnknown(code); else setErr(e);
    }
  };
  return (
    <Sheet title="Scan" onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
      <div className="stack">
        <Camera onCode={onCode} paused={!!unknown} />
        {unknown && <WhichItem barcode={unknown} filter={filter} onCancel={() => setUnknown(null)} onPicked={(item) => { setUnknown(null); give(item); }} />}
        <ErrorNote error={err} />
        <Tally rows={tally} />
      </div>
    </Sheet>
  );
}

export function PairSheet({ purpose, onItem, onClose }) {
  const { me, stock } = useApp();
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState({ open: true, paired: false });
  const [err, setErr] = useState(null);
  const [tally, add] = useTally();
  const seq = useRef(0);
  const onItemRef = useRef(onItem);
  onItemRef.current = onItem;

  useEffect(() => {
    let alive = true;
    let timer = null;
    let id = null;
    const poll = async () => {
      try {
        const r = await get(`/api/scan/sessions/${id}?after=${seq.current}`);
        if (!alive) return;
        for (const e of r.events) {
          seq.current = e.seq;
          const item = stock.items.find((i) => i.id === e.itemId);
          if (item) add(item, onItemRef.current(item) !== false);
        }
        setStatus({ open: r.open, paired: r.paired, expiresAt: r.expiresAt });
        if (!r.open) return;
      } catch (e) { if (alive) setErr(e); }
      if (alive) timer = setTimeout(poll, 1500);
    };
    (async () => {
      try {
        const s = await post('/api/scan/sessions', { purpose });
        if (!alive) { post(`/api/scan/sessions/${s.id}/close`).catch(() => {}); return; }
        id = s.id;
        setSession(s);
        poll();
      } catch (e) { if (alive) setErr(e); }
    })();
    return () => {
      alive = false;
      clearTimeout(timer);
      if (id) post(`/api/scan/sessions/${id}/close`).catch(() => {});
    };
  }, [purpose]); // eslint-disable-line react-hooks/exhaustive-deps

  const link = session ? `${location.origin}${location.pathname}#/scan/${session.id}?unit=${me.unit.id}` : '';
  const [svg, setSvg] = useState('');
  useEffect(() => {
    if (!link) return;
    // Loaded here only: a phone never draws a QR code, so it never downloads the library.
    import('qrcode-generator').then(({ default: qrcode }) => {
      const q = qrcode(0, 'M');
      q.addData(link);
      q.make();
      setSvg(q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }));
    }).catch((e) => setErr(e));
  }, [link]);
  return (
    <Sheet title="Scan with phone" onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
      <div className="stack">
        <ErrorNote error={err} />
        {session && status.open && (
          <>
            <p>Point your phone's camera at this code and open the link. Sign in as <b>{me.name}</b> if it asks. Each item you scan appears in the list here.</p>
            {/* Black on white whatever the theme: a phone cannot read a QR code in dark mode colours. */}
            <div className="qr" role="img" aria-label="QR code to open the scanner on your phone" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="row"><span className={`pill tone-${status.paired ? 'ok' : 'warn'}`}>{status.paired ? 'Phone connected' : 'Waiting for your phone'}</span>
              <span className="muted">Ends 15 minutes after the last scan{status.expiresAt ? ` (now ${fmtDateTime(status.expiresAt)})` : ''}.</span></p>
          </>
        )}
        {session && !status.open && <div className="note warn"><Icon name="clock" size={18} />This pairing has ended. Close this and press Scan with phone again to start a new one.</div>}
        <Tally rows={tally} />
      </div>
    </Sheet>
  );
}
