/**
 * Help: what each role may do (the same table the server enforces), and how the main flows go.
 */

import { Card, Page, Table, useApp } from '../ui.jsx';
import Icon from '../icons.jsx';

const ACTIONS = {
  'stock.view': 'See stock', 'stock.use': 'Record use and move linen', 'cost.view': 'See costs and values',
  'request.create': 'Ask for stock', 'request.decide': 'Approve requests', 'request.fulfil': 'Give out requested stock',
  transfer: 'Transfer between stores', receive: 'Receive deliveries', 'adjust.raise': 'Raise corrections',
  'adjust.decide': 'Approve corrections', 'count.run': 'Count stock', 'count.decide': 'Approve counts',
  'po.edit': 'Draft purchase orders', 'po.decide': 'Approve purchase orders', 'supplier.edit': 'Keep suppliers',
  'items.edit': 'Keep the item list and levels', reports: 'See reports', admin: 'Stores, rooms, people, settings, import',
};

const FLOWS = [
  ['use', 'Using stock', 'Record use → choose the store and the room → add items. Expiry items go first-expiry-first; expired stock is refused.'],
  ['requests', 'Getting stock from the store', 'New request → items and where they are needed → a manager approves (unless the unit has switched that off) → the store gives it out, in one go or several.'],
  ['purchasing', 'Buying', 'Purchasing → What to buy shows what is at or below its reorder level → draft an order per supplier → submit → a manager approves → print it for the supplier → Receive delivery against it when it arrives.'],
  ['linen', 'Linen', 'Each piece is clean on the shelf, in a room, or at the laundry. Send to a room, send to the laundry, take back clean. Today flags laundry that has not come back.'],
  ['counts', 'Counting', 'Start a count (blind by default) → count on a phone → submit → a manager reviews the differences and approves → stock is corrected. Use during the count is not taken twice.'],
  ['corrections', 'Write-offs and finds', 'New correction → reason and what happened → a manager approves → stock changes. Nothing moves until then.'],
];

export default function Help() {
  const { me } = useApp();
  const roles = Object.keys(me.labels.roles);
  const rows = Object.entries(ACTIONS).map(([a, label]) => ({ a, label, ...Object.fromEntries(roles.map((r) => [r, me.labels.rules[a]?.includes(r)])) }));
  return (
    <Page title="Help" subtitle="How HiFive Inventory works, and who may do what.">
      <div className="grid3">
        {FLOWS.map(([icon, title, text]) => (
          <Card key={title}><div className="row"><span className="row-icon"><Icon name={icon} size={18} /></span><h2 className="grow">{title}</h2></div><p className="muted">{text}</p></Card>
        ))}
      </div>
      <Card title="Who may do what" hint="Somebody may never approve what they raised themselves, unless they are the only approver in the unit." pad={false}>
        <Table rows={rows} rowKey={(r) => r.a} columns={[
          { key: 'label', label: 'Action', primary: true, sortable: false },
          ...roles.map((r) => ({ key: r, label: me.labels.roles[r].replace(' (read-only)', ''), sortable: false, render: (x) => (x[r] ? <Icon name="check" size={18} label="Yes" /> : <span className="faint">—</span>) })),
        ]} />
      </Card>
      <Card title="Your access">
        <p>You are <b>{me.roles.map((r) => me.labels.roles[r]).join(', ')}</b> in {me.unit.name}{me.groupAdmin ? ', and a group administrator for every unit' : ''}.{me.stores ? ' You record against selected stores only.' : ''}</p>
      </Card>
    </Page>
  );
}
