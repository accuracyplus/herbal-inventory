/**
 * Today: the person first (what is waiting on them, what happened to their requests), then the
 * unit's shelves (short, expiring, at the laundry). A section with nothing in it is left out or
 * collapses to one line, and a tile is never shown for zero.
 */

import { KeyValues } from '@hifive/ui';
import { fmtAgo, fmtDate, fmtMoney, fmtQty } from '../api.js';
import { Card, ErrorNote, Loading, Page, Pill, Quiet, StatusRows, Tile, useApp, useData } from '../ui.jsx';

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Dubai' }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const ICON = { requests: 'requests', purchasing: 'purchasing', corrections: 'corrections', counts: 'counts', 'with-me': 'custody', admin: 'unit', services: 'sparkle' };
const lines = (n) => `${n} line${n === 1 ? '' : 's'}`;

/** What is left, said the way a person would: "None left." or "2 kg left, reorder at 10." */
const left = (s) => `${s.storeName}. ${s.qty > 0 ? `${fmtQty(s.qty)} ${s.uom} left` : 'None left'}${s.level?.reorder ? `, reorder at ${fmtQty(s.level.reorder)}` : ''}.`;

export default function Today() {
  const { me, navigate, can, currency } = useApp();
  const { data, error, loading, reload } = useData('/api/today');
  const first = me.name.split(/\s+/)[0];
  const waiting = data ? data.waiting.length : null;
  const lede = waiting === null ? me.unit.name
    : waiting === 0 ? `Nothing is waiting on you at ${me.unit.name}.`
      : `${waiting} thing${waiting === 1 ? ' is' : 's are'} waiting on you at ${me.unit.name}.`;

  const tiles = [];
  if (data) {
    const gone = data.shortCounts.out + data.shortCounts.critical;
    if (can('cost.view') && data.stockValue > 0) {
      tiles.push(<Tile key="value" icon="stock" tone="brand" value={fmtMoney(data.stockValue, currency, 0)} label="stock on hand, at cost"
        hint="Every shelf, room and laundry piece in this unit, and stock with people, at average cost." onClick={() => navigate('reports')} />);
    }
    if (gone > 0) {
      tiles.push(<Tile key="gone" icon="alert" tone="danger" value={gone} label={gone === 1 ? 'item out or nearly out' : 'items out or nearly out'}
        hint="Nothing left, or less than the least this store should hold." onClick={() => navigate('stock?filter=short')} />);
    }
    if (data.shortCounts.low > 0) {
      tiles.push(<Tile key="low" icon="clock" tone="warn" value={data.shortCounts.low} label={data.shortCounts.low === 1 ? 'item running low' : 'items running low'}
        hint="At or under the level set for reordering." onClick={() => navigate('stock?filter=short')} />);
    }
    if (can('cost.view') && data.month?.used > 0) {
      tiles.push(<Tile key="used" icon="use" tone="accent" value={fmtMoney(data.month.used, currency, 0)} label="used so far this month"
        hint="Value of everything recorded as used since the 1st, at average cost." onClick={() => navigate('reports')} />);
    }
  }

  return (
    <Page title={`${greeting()}, ${first}`} subtitle={lede}>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <>
          {tiles.length > 0 && <div className="inv-tiles" role="group" aria-label={`${me.unit.name} now`}>{tiles}</div>}

          <div className="grid2">
            <div className="stack" style={{ gap: 18 }}>
              <Card title="Waiting on you" pad={false}>
                {data.waiting.length ? (
                  <StatusRows rows={data.waiting.map((w) => ({
                    key: w.key, icon: ICON[w.screen] || 'requests', label: w.text,
                    flag: w.urgent > 0 && w.key !== 'po-receive' ? `${w.urgent} urgent` : null,
                    onClick: () => navigate(w.to || `${w.screen}${w.filter ? `?status=${w.filter}` : ''}`),
                  }))} />
                ) : <Quiet>Nothing is waiting on you.</Quiet>}
              </Card>

              {data.mine.length > 0 && (
                <Card title="Your requests this week" pad={false}>
                  <StatusRows rows={data.mine.map((r) => ({
                    key: r.id, label: r.ref, end: <Pill status={r.status} />,
                    sub: `${r.summary || ''}${r.decision_note ? ` “${r.decision_note}”` : ''}`,
                    onClick: () => navigate(`requests/${r.id}`),
                  }))} />
                </Card>
              )}
            </div>

            <div className="stack" style={{ gap: 18 }}>
              {data.short.length > 0 && (
                <Card title="Short now" pad={false} actions={data.short.length > 5 ? <a className="hf-btn hf-btn--quiet" href="#/stock?filter=short">All {data.short.length}</a> : null}>
                  <StatusRows rows={data.short.slice(0, 5).map((s) => ({
                    key: `${s.itemId}-${s.storeId}`, label: s.name, sub: left(s), end: <Pill status={s.status} />,
                    onClick: () => navigate(`stock/${s.itemId}`),
                  }))} />
                </Card>
              )}

              {data.expiring.length > 0 && (
                <Card title="Expiring soon" pad={false} hint={`Batches that expire within ${data.warnDays} days. Expired stock is never handed out; write it off with a correction.`}>
                  <StatusRows rows={data.expiring.slice(0, 5).map((b) => ({
                    key: b.id, label: b.name,
                    sub: `${b.batch_no ? `Lot ${b.batch_no}. ` : ''}${fmtQty(b.qty)} ${b.uom} in ${b.store_name}.`,
                    end: <Pill tone={b.expired ? 'danger' : 'warn'}>{b.expired ? `Expired ${fmtDate(b.expiry)}` : fmtDate(b.expiry)}</Pill>,
                    onClick: () => navigate(`stock/${b.item_id}`),
                  }))} />
                </Card>
              )}

              {data.laundryLate.length > 0 && (
                <Card title="At the laundry" pad={false} hint={`Nothing has come back for ${data.washDays} days or more.`}>
                  <StatusRows rows={data.laundryLate.map((l) => ({
                    key: l.itemId + l.storeName, icon: 'linen', label: `${fmtQty(l.inWash)} × ${l.name}`,
                    sub: `${l.storeName}. Last movement ${fmtAgo(l.since)}.`, onClick: () => navigate('linen'),
                  }))} />
                </Card>
              )}

              {(data.day.issues > 0 || data.day.receipts > 0 || data.day.transfers > 0 || data.month?.writtenOff > 0) && (
                <Card title="Today so far">
                  <KeyValues items={[
                    { label: 'Used', value: data.day.issues > 0 && `${lines(data.day.issues)}${can('cost.view') && data.day.usedValue ? `, ${fmtMoney(data.day.usedValue, currency)}` : ''}` },
                    { label: 'Received', value: data.day.receipts > 0 && lines(data.day.receipts) },
                    { label: 'Transferred', value: data.day.transfers > 0 && lines(data.day.transfers) },
                    { label: 'Written off this month', value: data.month?.writtenOff > 0 && fmtMoney(data.month.writtenOff, currency, 0) },
                  ]} />
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
