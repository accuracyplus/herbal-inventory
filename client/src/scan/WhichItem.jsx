/**
 * "Which item is this?" for a barcode nobody knows yet. Somebody who may link barcodes can save it
 * to the item, so the next scan finds it; anybody can pick the item for this time only.
 */

import { useState } from 'react';
import { post } from '../api.js';
import { Button, Check, ErrorNote, ItemPicker, useApp } from '../ui.jsx';

export default function WhichItem({ barcode, filter, onPicked, onCancel }) {
  const { stock, can } = useApp();
  const mayLink = can('barcode.link');
  const [link, setLink] = useState(mayLink);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const pick = async (item) => {
    setErr(null);
    if (link) {
      setBusy(true);
      try { await post(`/api/items/${item.id}/barcodes`, { barcode }); } catch (e) { setErr(e); setBusy(false); return; }
      setBusy(false);
    }
    onPicked(item, link);
  };
  return (
    <div className="hf-card inv-card which-item" role="group" aria-label="Unknown barcode">
      <div className="stack">
        <div>
          <h2 className="hf-cap">Which item is this?</h2>
          <p className="muted">Nothing in this unit has the code <code>{barcode}</code>.</p>
        </div>
        <ItemPicker items={stock?.items || []} onPick={pick} filter={filter} placeholder="Find the item — name or code" />
        {mayLink
          ? <Check checked={link} onChange={setLink}>Save this barcode to the item, so it is found next time</Check>
          : <p className="muted">It is added this time only. A store keeper can save the barcode to the item.</p>}
        <ErrorNote error={err} />
        <div className="row" style={{ justifyContent: 'flex-end' }}><Button kind="secondary" busy={busy} onClick={onCancel}>Skip it</Button></div>
      </div>
    </div>
  );
}
