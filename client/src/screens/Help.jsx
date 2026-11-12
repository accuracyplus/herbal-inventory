/**
 * Help: what each role may do (the same table the server enforces), and how the main flows go.
 */

import { Card, Page, Table, useApp } from '../ui.jsx';
import Icon from '../icons.jsx';

const ACTIONS = {
  'stock.view': 'See stock', 'stock.use': 'Record use and move linen', 'use.for_others': 'Record use or give stock for somebody else', 'custody.team': 'See and settle what the team holds', 'cost.people': 'See cost per person', 'cost.view': 'See costs and values',
  'request.create': 'Ask for stock', 'request.decide': 'Approve requests', 'request.fulfil': 'Give out requested stock',
  transfer: 'Transfer between stores', receive: 'Record deliveries and attach their paperwork', 'receipt.decide': 'Approve deliveries', 'adjust.raise': 'Raise corrections',
  'adjust.decide': 'Approve corrections', 'count.run': 'Count stock', 'count.decide': 'Approve counts',
  'po.edit': 'Draft purchase orders', 'po.decide': 'Approve purchase orders', 'supplier.edit': 'Keep suppliers',
  'items.edit': 'Keep the item list and levels', 'services.edit': 'Keep services and their recipes', 'barcode.link': 'Save an unknown barcode to an item', reports: 'See reports', admin: 'Stores, departments, rooms, people, settings, import',
};

const FLOWS = [
  ['use', 'Using stock', 'Record use → choose the store, the room and who used it → add items. Expiry items go first-expiry-first; expired stock is refused.'],
  ['scan', 'Scanning', 'Scan on any list of items uses this device\'s camera; on a computer, Scan with phone shows a code to open on your phone, and each scan lands on the computer\'s list. Scan in the menu is for walking the store. A barcode nobody knows asks which item it is.'],
  ['sparkle', 'Recording a service by its recipe', 'Services (your unit may call them treatments or tests) → choose what was done and how many → its usual items are laid out → change anything that differed → record. It all comes off the store together. Reports compares what was used with the recipe.'],
  ['purchasing', 'Suppliers and their prices', 'Purchasing → Suppliers → a supplier: how their orders went over the last year, and what they charge for each item. An item\'s window shows every supplier\'s last price side by side. While an order is written, each line says what was paid last time. An approved order has a PDF button, and, once emailing is set up, a button that sends it to the supplier.'],
  ['download', 'Services from bookings or billing', 'For managers: Services → From bookings or billing. A connected system sends each one done and the stock comes off by itself; the same reference is never counted twice. One that could not be recorded waits there with the reason: fix it, then Try again. Until a system is connected, upload the sheet from the same page.'],
  ['receive', 'Receiving a delivery', 'Receive → photograph the delivery note to fill the form in, or type it → count what arrived against the note → attach the note → record. A manager approves it under Purchasing → Deliveries, seeing any difference from the note or the order, and then the stock is on the shelf.'],
  ['download', 'Many items at once', 'Admin → Bulk upload → download the sheet, edit it in Excel, choose the file. It is checked first and shows what would be added or changed; nothing is saved until you press Save, and a file with a problem saves nothing.'],
  ['custody', 'Taking stock to use later', 'With me → Take stock → it stays with you until you record it as used or return it. Only used stock counts as consumption. Held too long, it is flagged to you and your manager.'],
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
          <Card key={title}><div className="row"><span className="inv-well"><Icon name={icon} size={18} /></span><h2 className="grow">{title}</h2></div><p className="muted">{text}</p></Card>
        ))}
      </div>
      <Card title="Who may do what" hint="Somebody may never approve what they raised themselves, unless they are the only approver in the unit." pad={false}>
        <Table rows={rows} rowKey={(r) => r.a} columns={[
          { key: 'label', label: 'Action', primary: true, sortable: false },
          ...roles.map((r) => ({ key: r, label: me.labels.roles[r].replace(' (read-only)', ''), sortable: false, render: (x) => (x[r] ? <Icon name="check" size={18} label="Yes" /> : '') })),
        ]} />
      </Card>
      <Card title="Your access">
        <p>You are <b>{me.roles.map((r) => me.labels.roles[r]).join(', ')}</b> in {me.unit.name}{me.groupAdmin ? ', and a group administrator for every unit' : ''}.{me.stores ? ' You record against selected stores only.' : ''}</p>
      </Card>
    </Page>
  );
}
