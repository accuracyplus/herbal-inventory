/**
 * Trace a lot (feature 14, `recall.on`): type a batch or lot number, choose it, and see where
 * it came from, every store, room, person and service it went to, and what is left.
 */

import { useState } from 'react';
import { downloadCsv, fmtDate, fmtDateTime, fmtQty } from '../api.js';
import { t } from '../i18n.js';
import { Button, Card, ErrorNote, Loading, Page, Pill, Quiet, SearchBox, Table, useApp, useData } from '../ui.jsx';

export default function Recall() {
  const { route, navigate } = useApp();
  const [q, setQ] = useState(route.query.get('lot') || '');
  const item = route.query.get('item');
  const lot = route.query.get('lot');
  const term = q.trim();
  const { data: found, error, loading } = useData(!item && term.length >= 2 ? `/api/recall?q=${encodeURIComponent(term)}` : null, [term, item]);
  return (
    <Page title="Trace a lot" subtitle="Where one batch came from, everywhere it went, and what is left. For a recall, or a question about one lot.">
      {item && lot
        ? <Trace item={item} lot={lot} onBack={() => navigate(`recall?lot=${encodeURIComponent(lot)}`)} />
        : (
          <>
            <SearchBox value={q} onChange={setQ} placeholder="Type a lot or batch number" />
            <ErrorNote error={error} />
            {loading && <Loading />}
            {term.length < 2 && <Quiet icon="info">Type at least two characters of the lot number printed on the pack.</Quiet>}
            {found && !found.length && term.length >= 2 && <Card><Quiet>{t('No lot with "{term}" in its number has been received in this unit.', { term })}</Quiet></Card>}
            {found?.length > 0 && (
              <Card pad={false}>
                <Table caption="Lots" rows={found} rowKey={(l) => `${l.item_id}|${l.batch_no}`} onRow={(l) => navigate(`recall?item=${l.item_id}&lot=${encodeURIComponent(l.batch_no)}`)} columns={[
                  { key: 'batch_no', label: 'Lot', primary: true, render: (l) => <span className="min0"><span className="row-label">{l.batch_no}</span><span className="row-sub">{l.name} · <code>{l.code}</code></span></span> },
                  { key: 'expiry', label: 'Expiry', render: (l) => (l.expiry ? fmtDate(l.expiry) : '') },
                  { key: 'left_qty', label: 'Left', align: 'right', render: (l) => `${fmtQty(l.left_qty)} ${t(l.uom)}` },
                  { key: 'last_in', label: 'Last received', render: (l) => fmtDate(l.last_in) },
                ]} />
              </Card>
            )}
          </>
        )}
    </Page>
  );
}

function Trace({ item, lot, onBack }) {
  const { data: tr, error, loading } = useData(`/api/recall?item=${item}&lot=${encodeURIComponent(lot)}`, [item, lot]);
  if (error) return <ErrorNote error={error} />;
  if (loading || !tr) return <Loading />;
  const u = t(tr.item.uom);
  const exportCsv = () => downloadCsv(`trace-${tr.item.code}-${tr.lot}.csv`, tr.went, [
    { label: 'When', value: (m) => m.at }, { key: 'what', label: 'What' }, { label: 'Quantity', value: (m) => m.qty }, { key: 'store', label: 'Store' },
    { key: 'where', label: 'Room or bench' }, { key: 'service', label: 'Service' }, ...(tr.namesShown ? [{ key: 'person', label: 'Person' }] : []),
    { key: 'ref', label: 'Document' }, { key: 'reason', label: 'Reason' },
  ]);
  return (
    <>
      <div className="row">
        <Button kind="ghost" icon="back" onClick={onBack}>Other lots</Button>
        <span className="grow" />
        <Button kind="secondary" icon="download" onClick={exportCsv}>CSV</Button>
      </div>
      <Card title={t('{name}, lot {lot}', { name: tr.item.name, lot: tr.lot })}>
        <dl className="hf-kv hf-kv--3">
          <div><dt>{t('Received')}</dt><dd>{fmtQty(tr.totals.received)} {u}</dd></div>
          {tr.totals.used > 0 && <div><dt>{t('Used')}</dt><dd>{fmtQty(tr.totals.used)} {u}</dd></div>}
          <div><dt>{t('Left in stores')}</dt><dd>{fmtQty(tr.totals.left)} {u}</dd></div>
          {tr.totals.withPeople > 0 && <div><dt>{t('With people')}</dt><dd>{fmtQty(tr.totals.withPeople)} {u}</dd></div>}
          {tr.expiry.length > 0 && <div><dt>{t('Expiry')}</dt><dd>{tr.expiry.map(fmtDate).join(', ')}</dd></div>}
        </dl>
      </Card>
      <Card title="Came in" pad={false}>
        <Table caption="Came in" rows={tr.cameIn} rowKey={(r) => r.ref} empty="It came in before deliveries were recorded here (the opening stock)." columns={[
          { key: 'ref', label: 'Delivery', primary: true, render: (r) => <span className="min0"><span className="row-label">{r.ref}</span><span className="row-sub">{[r.supplier_name, r.note_no && t('note {no}', { no: r.note_no }), r.invoice_no && t('invoice {no}', { no: r.invoice_no })].filter(Boolean).join(' · ')}</span></span> },
          { key: 'at', label: 'When', render: (r) => fmtDate(r.decided_at || r.at) },
          { key: 'store_name', label: 'Into' },
          { key: 'qty', label: 'Quantity', align: 'right', render: (r) => `${fmtQty(r.qty)} ${u}` },
        ]} />
      </Card>
      <Card title="Where it went" pad={false}>
        <Table caption="Where it went" rows={tr.went} rowKey={(m, i) => `${m.at}-${i}`} empty="None of it has moved since it came in." columns={[
          { key: 'at', label: 'When', render: (m) => <span className="nowrap">{fmtDateTime(m.at)}</span> },
          { key: 'what', label: 'What', primary: true, render: (m) => (
            <span className="min0"><span className="row-label">{t(m.what)}</span>
              <span className="row-sub">{[m.store, m.counterpart && t(m.qty < 0 ? 'to {store}' : 'from {store}', { store: m.counterpart }), m.where, m.service, m.person, m.ref, m.reason].filter(Boolean).join(' · ')}</span></span>
          ) },
          { key: 'qty', label: 'Quantity', align: 'right', render: (m) => <b>{m.qty > 0 ? '+' : ''}{fmtQty(m.qty)}</b> },
        ]} />
      </Card>
      {tr.left.length > 0 && (
        <Card title="Left" pad={false}>
          <Table caption="Left" rows={tr.left} rowKey={(l) => `${l.store}|${l.expiry}`} columns={[
            { key: 'store', label: 'Store', primary: true },
            { key: 'qty', label: 'On the shelf', align: 'right', render: (l) => `${fmtQty(l.qty)} ${u}` },
            { key: 'onHold', label: 'Held for inspection', align: 'right', render: (l) => (l.onHold > 0 ? `${fmtQty(l.onHold)} ${u}` : '') },
          ]} />
        </Card>
      )}
      {tr.withPeople.length > 0 && (
        <Card title="With people" pad={false}>
          <Table caption="With people" rows={tr.withPeople} rowKey={(h, i) => i} columns={[
            { key: 'takenAt', label: 'Taken', primary: true, render: (h) => <span className="min0"><span className="row-label">{fmtDateTime(h.takenAt)}</span><span className="row-sub">{[h.person, h.where].filter(Boolean).join(' · ')}</span></span> },
            { key: 'qty', label: 'Quantity', align: 'right', render: (h) => `${fmtQty(h.qty)} ${u}` },
          ]} />
        </Card>
      )}
      {tr.opened.length > 0 && (
        <Card title="Opened packs" pad={false}>
          <Table caption="Opened packs" rows={tr.opened} rowKey={(o, i) => i} columns={[
            { key: 'opened_at', label: 'Opened', primary: true, render: (o) => <span className="min0"><span className="row-label">{fmtDateTime(o.opened_at)}</span><span className="row-sub">{[o.area_name, o.department_name, o.opened_by_name].filter(Boolean).join(' · ')}</span></span> },
            { key: 'status', label: 'Now', render: (o) => <Pill tone={o.status === 'OPEN' ? 'warn' : 'plain'}>{o.status === 'OPEN' ? 'In use' : o.status === 'FINISHED' ? 'Finished' : 'Thrown away'}</Pill> },
          ]} />
        </Card>
      )}
      {!tr.namesShown && <Quiet icon="info">Who used it is shown to managers. You see the room, bench and service.</Quiet>}
    </>
  );
}
