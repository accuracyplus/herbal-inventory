/**
 * Today: me first (what is waiting for me, what happened to my requests), then the unit's
 * shelves (short, expiring, at the laundry). Sections with nothing in them collapse to a line.
 */

import { fmtAgo, fmtDate, fmtMoney, fmtQty } from '../api.js';
import { Card, ErrorNote, Loading, Page, Pill, Quiet, StatusRows, Tile, useApp, useData } from '../ui.jsx';
import Icon from '../icons.jsx';

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Dubai' }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const ICON = { requests: 'requests', purchasing: 'purchasing', corrections: 'corrections', counts: 'counts' };

export default function Today() {
  const { me, navigate, can, currency } = useApp();
  const { data, error, loading, reload } = useData('/api/today');
  const first = me.name.split(/\s+/)[0];
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dubai' });

  return (
    <Page title={`${greeting()}, ${first}`} subtitle={`${date} · ${me.unit.name}`}
      actions={can('stock.use') ? <button className="btn btn-primary" onClick={() => navigate('use')}><Icon name="use" size={18} />Record use</button> : null}>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && (
        <>
          <div className="tiles">
            {can('cost.view') && data.stockValue !== null && (
              <Tile icon="stock" tone="brand" value={fmtMoney(data.stockValue, currency, 0)} label="Stock value on hand" hint="Every shelf, room and laundry piece in this unit, at average cost." onClick={() => navigate('reports')} />
            )}
            <Tile icon="alert" tone={data.shortCounts.out + data.shortCounts.critical ? 'danger' : 'ok'}
              value={data.shortCounts.out + data.shortCounts.critical}
              label={data.shortCounts.out + data.shortCounts.critical === 1 ? 'item out or critical' : 'items out or critical'}
              onClick={() => navigate('stock?filter=short')} />
            <Tile icon="clock" tone={data.shortCounts.low ? 'warn' : 'ok'} value={data.shortCounts.low} label="running low" onClick={() => navigate('stock?filter=short')} />
            <Tile icon="sparkle" tone={data.expiring.length ? 'warn' : 'ok'} value={data.expiring.length}
              label={`batches expiring within ${data.warnDays} days`} onClick={() => navigate('reports?r=expiry')} />
            {can('cost.view') && data.month && (
              <Tile icon="use" tone="accent" value={fmtMoney(data.month.used, currency, 0)} label="used this month" hint="Value of everything recorded as used since the 1st, at average cost." />
            )}
          </div>

          <div className="grid2">
            <div className="stack">
              <Card title="Waiting for you">
                {data.waiting.length ? (
                  <StatusRows rows={data.waiting.map((w) => ({
                    key: w.key, icon: ICON[w.screen] || 'requests', label: w.text,
                    flag: w.urgent > 0 && w.key !== 'po-receive' ? `${w.urgent} urgent` : null,
                    tone: w.urgent ? 'danger' : 'brand',
                    onClick: () => navigate(`${w.screen}${w.filter ? `?status=${w.filter}` : ''}`),
                  }))} />
                ) : <Quiet>Nothing waiting for you.</Quiet>}
              </Card>

              {data.short.length > 0 && (
                <Card title="Running short" actions={<button className="btn btn-ghost sm" onClick={() => navigate('stock?filter=short')}>See all</button>}>
                  <StatusRows rows={data.short.slice(0, 8).map((s) => ({
                    key: `${s.itemId}-${s.storeId}`, icon: 'stock', tone: s.status === 'LOW' ? 'warn' : 'danger',
                    label: s.name, sub: `${fmtQty(s.qty)} ${s.uom} in ${s.storeName}${s.level?.reorder ? ` · reorder at ${fmtQty(s.level.reorder)}` : ''}`,
                    onClick: () => navigate(`stock/${s.itemId}`),
                  }))} />
                </Card>
              )}

              {data.expiring.length > 0 && (
                <Card title="Expiring" hint={`Batches expiring within ${data.warnDays} days. Expired stock is never handed out; write it off with a correction.`}>
                  <StatusRows rows={data.expiring.slice(0, 8).map((b) => ({
                    key: b.id, icon: 'clock', tone: b.expired ? 'danger' : 'warn',
                    label: b.name, sub: `${fmtQty(b.qty)} ${b.uom} in ${b.store_name} · ${b.expired ? 'expired' : 'expires'} ${fmtDate(b.expiry)}${b.batch_no ? ` · lot ${b.batch_no}` : ''}`,
                    onClick: () => navigate(`stock/${b.item_id}`),
                  }))} />
                </Card>
              )}
            </div>

            <div className="stack">
              {data.mine.length > 0 && (
                <Card title="Your requests this week">
                  <StatusRows rows={data.mine.map((r) => ({
                    key: r.id, icon: 'requests', tone: r.status === 'REJECTED' ? 'danger' : r.status === 'ISSUED' ? 'ok' : 'brand',
                    label: <>{r.ref} <Pill status={r.status} /></>,
                    sub: `${r.summary || ''}${r.decision_note ? ` — “${r.decision_note}”` : ''}`,
                    onClick: () => navigate(`requests/${r.id}`),
                  }))} />
                </Card>
              )}

              {data.laundryLate.length > 0 && (
                <Card title="At the laundry" hint={`Nothing has come back for ${data.washDays} days or more.`}>
                  <StatusRows rows={data.laundryLate.map((l) => ({
                    key: l.itemId + l.storeName, icon: 'linen', tone: 'warn', label: `${fmtQty(l.inWash)} × ${l.name}`,
                    sub: `${l.storeName} · last movement ${fmtAgo(l.since)}`, onClick: () => navigate('linen'),
                  }))} />
                </Card>
              )}

              <Card title="Today so far">
                <dl className="dl">
                  <dt>Used</dt><dd>{data.day.issues} line{data.day.issues === 1 ? '' : 's'}{can('cost.view') && data.day.usedValue ? ` · ${fmtMoney(data.day.usedValue, currency)}` : ''}</dd>
                  <dt>Received</dt><dd>{data.day.receipts} line{data.day.receipts === 1 ? '' : 's'}</dd>
                  <dt>Transferred</dt><dd>{data.day.transfers} line{data.day.transfers === 1 ? '' : 's'}</dd>
                  {data.month && <><dt>Written off this month</dt><dd>{fmtMoney(data.month.writtenOff, currency, 0)}</dd></>}
                </dl>
              </Card>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
