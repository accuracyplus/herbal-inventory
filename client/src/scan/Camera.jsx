/**
 * The camera, reading barcodes, with a box to type a code for the day the label is torn or the
 * camera is refused. A code still in view is not read again; move the camera away and back to
 * count the same item twice.
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui.jsx';
import { makeReader } from './reader.js';

const SAY = {
  starting: 'Starting the camera…',
  denied: 'The camera was refused. Allow it for this site in the browser settings, or type the code below.',
  none: 'No camera can be used here. Type the code below instead.',
};

export default function Camera({ onCode, paused = false }) {
  const video = useRef(null);
  const [state, setState] = useState('starting');
  const [typed, setTyped] = useState('');
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const seen = useRef(new Map());

  useEffect(() => {
    let stream = null;
    let stopped = false;
    let timer = null;
    const emit = (code) => {
      const now = Date.now();
      const last = seen.current.get(code) || 0;
      seen.current.set(code, now);
      if (now - last < 1500) return;
      navigator.vibrate?.(60);
      onCodeRef.current(code);
    };
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setState('none'); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch (e) {
        setState(e?.name === 'NotAllowedError' ? 'denied' : 'none');
        return;
      }
      if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
      const v = video.current;
      v.srcObject = stream;
      await v.play().catch(() => {});
      setState('on');
      const reader = await makeReader();
      const tick = async () => {
        if (stopped) return;
        if (!pausedRef.current && v.readyState >= 2) {
          const code = await reader.read(v).catch(() => null);
          if (code && !stopped) emit(code);
        }
        timer = setTimeout(tick, reader.kind === 'native' ? 150 : 250);
      };
      tick();
    })();
    return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const v = typed.trim();
    if (!v) return;
    setTyped('');
    onCodeRef.current(v);
  };

  return (
    <div className="stack">
      <div className={`camera ${state === 'on' ? 'on' : ''}`}>
        <video ref={video} playsInline muted aria-label="Camera" />
        {state === 'on' && <span className="camera-frame" aria-hidden="true" />}
        {state !== 'on' && <p className="camera-say">{SAY[state]}</p>}
        {state === 'on' && paused && <p className="camera-say">Paused</p>}
      </div>
      <form className="row" onSubmit={submit} style={{ flexWrap: 'nowrap' }}>
        <input className="hf-input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Or type the code" aria-label="Type a barcode or item code" inputMode="text" autoComplete="off" />
        <Button kind="secondary" type="submit" disabled={paused}>Add</Button>
      </form>
    </div>
  );
}
