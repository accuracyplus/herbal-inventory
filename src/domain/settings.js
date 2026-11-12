/**
 * Per-unit settings, with the defaults written down here so a unit that has set nothing
 * behaves sensibly and the Settings screen can show what each one means.
 */

import { refuse } from '../lib/errors.js';

export const SETTINGS = {
  'requests.approval': {
    label: 'Requests need a manager\'s approval',
    hint: 'When off, a request goes straight to the store to be given out.',
    options: ['required', 'none'], default: 'required',
  },
  'receipts.approval': {
    label: 'Deliveries need a second person\'s approval',
    hint: 'When on, the receiver records the delivery and a manager approves it before stock reaches the shelf. When off, a delivery is on the shelf as soon as it is recorded.',
    options: ['required', 'none'], default: 'required',
    labels: { required: 'Yes, a manager approves first', none: 'No, on the shelf when recorded' },
  },
  'receipts.note': {
    label: 'A delivery needs its delivery note attached',
    hint: 'A photo or PDF of the delivery note, or the invoice for a purchase with no note, before it can be approved.',
    options: ['required', 'optional'], default: 'required',
    labels: { required: 'Yes, it cannot be approved without it', optional: 'No, it can be approved without' },
  },
  'receipts.read_notes': {
    label: 'Read delivery notes from a photo',
    hint: 'Fills in the supplier, note number and lines from a photo for the receiver to check. Each note read costs a fraction of a cent.',
    options: ['on', 'off'], default: 'on',
    labels: { on: 'On', off: 'Off' },
  },
  'consumption.record': {
    label: 'When stock is used, record',
    hint: 'What must be filled in on Record use. A department comes from the room.',
    options: ['both', 'room', 'person'], default: 'both',
    labels: { both: 'The room and the person', room: 'The room only', person: 'The person only' },
  },
  'services.word': {
    label: 'What this unit calls its services',
    hint: 'The word used on the menu and screens for the work that uses stock by a recipe: a treatment at a spa, a test in a lab.',
    options: ['Services', 'Treatments', 'Tests'], default: 'Services',
  },
  'custody.account_hours': {
    label: 'Call taken stock unaccounted for after this many hours',
    hint: 'Stock somebody has taken and not recorded as used or returned by then is flagged to them and to their manager on Today.',
    number: [1, 720], default: '24',
  },
  'expiry.warn_days': {
    label: 'Warn about expiry this many days ahead',
    hint: 'Batches expiring within this many days show on Today and in the expiry report.',
    number: [1, 365], default: '60',
  },
  'linen.wash_alert_days': {
    label: 'Flag linen at the laundry after this many days',
    hint: 'Pieces sent to the laundry and not back after this many days are flagged on Today.',
    number: [1, 30], default: '3',
  },
  'slow.days': {
    label: 'Call an item slow-moving after this many days unused',
    hint: 'Used by the slow-moving report.',
    number: [14, 365], default: '90',
  },
  'lots.opened': {
    label: 'Opened packs and storage',
    hint: 'For a laboratory: items say where they are kept and how long they last once opened, and an In use screen follows each opened kit or reagent to its bench or analyser until it is finished. Off, none of it shows.',
    options: ['off', 'on'], default: 'off',
    labels: { off: 'Off', on: 'On: show storage, opened packs and the In use screen' },
  },
  'lots.due_days': {
    label: 'Warn about an opened pack this many days before its in-use date',
    hint: 'Opened packs due within this many days show on Today, beside those already past their date.',
    number: [0, 30], default: '2',
  },
  'forecast.lead_days': {
    label: 'Days a delivery usually takes, when the supplier has none set',
    hint: 'Used for suggested levels in a main store. A supplier\'s own usual delivery time, set on the supplier, comes first.',
    number: [1, 120], default: '7',
  },
  'forecast.restock_days': {
    label: 'Days to restock a sub store from the main store',
    hint: 'Used for suggested levels in a sub store, which is filled from the main store rather than by a supplier.',
    number: [1, 30], default: '2',
  },
  'forecast.safety_days': {
    label: 'Days of use to keep to spare',
    hint: 'Suggested reorder levels leave this many days of use on the shelf when the order arrives, for a busy week or a late delivery.',
    number: [0, 60], default: '3',
  },
  'forecast.cover_days': {
    label: 'Days one order should last',
    hint: 'Suggested top-up levels hold this many days of use above the reorder level. More days, fewer and larger orders.',
    number: [1, 180], default: '14',
  },
  'currency': {
    label: 'Currency', hint: 'Shown beside every cost and value.', options: ['AED'], default: 'AED',
  },

  // ── Enterprise features (feature 14): each off until a unit switches it on ──────────────
  // `when` hides a detail setting on the Settings screen until its feature is on.
  'limits.on': {
    group: 'more', label: 'Approval limits by amount',
    hint: 'Above the amounts below, a purchase order, a correction or a count needs a unit administrator or a director, not a manager.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off: any manager approves any amount', on: 'On: larger amounts go higher' },
  },
  'limits.po': {
    group: 'more', when: 'limits.on', label: 'A manager approves purchase orders up to (AED)',
    hint: 'The order\'s total. 0 means no limit.', number: [0, 10000000], default: '5000',
  },
  'limits.writeoff': {
    group: 'more', when: 'limits.on', label: 'A manager approves corrections up to (AED)',
    hint: 'The value taken off (or put on) by one correction. 0 means no limit.', number: [0, 10000000], default: '1000',
  },
  'limits.count': {
    group: 'more', when: 'limits.on', label: 'A manager approves count differences up to (AED)',
    hint: 'All of one count\'s differences together, short and over. 0 means no limit.', number: [0, 10000000], default: '1000',
  },
  'packs.on': {
    group: 'more', label: 'Pack sizes',
    hint: 'Buy by the carton, store by the box, use by the piece: each item can have packs, and a supplier its own. Stock is always kept in the item\'s own unit underneath.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off', on: 'On' },
  },
  'locations.on': {
    group: 'more', label: 'Shelf locations',
    hint: 'A rack, shelf or bin for each item in each store, shown when giving stock out and on count sheets.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off', on: 'On' },
  },
  'quarantine.on': {
    group: 'more', label: 'Hold deliveries for inspection',
    hint: 'Received stock is held as not usable until somebody checks it and releases it, or sends it back. For ISO 15189 in a laboratory.',
    options: ['off', 'flagged', 'all'], default: 'off',
    labels: { off: 'Off', flagged: 'Only items marked "inspect on arrival"', all: 'Every delivery' },
  },
  'returns.on': {
    group: 'more', label: 'Returns to supplier',
    hint: 'Send damaged or wrong goods back against a delivery, and follow up the credit note.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off', on: 'On' },
  },
  'recall.on': {
    group: 'more', label: 'Recall tracing',
    hint: 'For a batch or lot number: every store, room, person and service it went to, and what is left.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off', on: 'On' },
  },
  'landed.on': {
    group: 'more', label: 'Landed cost',
    hint: 'Freight, customs and other charges on a delivery are spread over its items, so their cost includes getting them here.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off', on: 'On' },
  },
  'assets.on': {
    group: 'more', label: 'Equipment register',
    hint: 'Equipment with its serial number, where it is, its warranty and when it is next due for service.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off', on: 'On' },
  },
  'assets.warn_days': {
    group: 'more', when: 'assets.on', label: 'Warn about a service or warranty this many days ahead',
    hint: 'Equipment due for service, or whose warranty ends, within this many days shows on Today.', number: [1, 120], default: '14',
  },
  'abc.on': {
    group: 'more', label: 'ABC cycle counts',
    hint: 'Items are graded by how much of the unit\'s use they are worth: A items, the few that are most of it, are counted most often.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off', on: 'On' },
  },
  'abc.a_days': { group: 'more', when: 'abc.on', label: 'Count A items every this many days', hint: 'The few items that are most of the value used.', number: [7, 365], default: '30' },
  'abc.b_days': { group: 'more', when: 'abc.on', label: 'Count B items every this many days', hint: 'The middle.', number: [7, 365], default: '90' },
  'abc.c_days': { group: 'more', when: 'abc.on', label: 'Count C items every this many days', hint: 'The many items worth little of the total.', number: [7, 730], default: '180' },
  'accounting.on': {
    group: 'more', label: 'Accounts: VAT, exports and month close',
    hint: 'VAT on deliveries, exports of purchases, use and write-offs for the accounts system, and closing a month so nothing in it can change.',
    options: ['off', 'on'], default: 'off', labels: { off: 'Off', on: 'On' },
  },
  'accounting.vat_rate': {
    group: 'more', when: 'accounting.on', label: 'VAT rate on deliveries (%)',
    hint: 'Filled in on each delivery line; change it on a line that is zero-rated or exempt.', number: [0, 100], default: '5',
  },
};

/** Is a feature switched on for the unit? `on` for most, anything but `off` for quarantine. */
export const featureOn = async (env, unitId, key) => {
  const v = await setting(env, unitId, key);
  return v !== null && v !== 'off';
};

/** Refuse a feature's routes while the unit has it off, saying where it is switched on. */
export async function requireFeature(env, unitId, key) {
  if (!(await featureOn(env, unitId, key))) {
    refuse('FEATURE_OFF', `${SETTINGS[key].label} is switched off for this unit. A unit administrator switches it on in Admin, Settings.`, 409);
  }
}

export async function setting(env, unitId, key) {
  const row = await env.DB.prepare(`SELECT value FROM settings WHERE unit_id = ? AND key = ?`).bind(unitId, key).first();
  return row?.value ?? SETTINGS[key]?.default ?? null;
}

export async function allSettings(env, unitId) {
  const { results } = await env.DB.prepare(`SELECT key, value FROM settings WHERE unit_id = ?`).bind(unitId).all();
  const set = new Map((results || []).map((r) => [r.key, r.value]));
  return Object.entries(SETTINGS).map(([key, s]) => ({ key, ...s, value: set.get(key) ?? s.default }));
}

export function validSetting(key, value) {
  const s = SETTINGS[key];
  if (!s) refuse('BAD_SETTING', `There is no setting called ${key}.`);
  const v = String(value ?? '').trim();
  if (s.options && !s.options.includes(v)) refuse('BAD_SETTING', `${s.label}: choose one of ${s.options.join(', ')}.`);
  if (s.number) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < s.number[0] || n > s.number[1]) {
      refuse('BAD_SETTING', `${s.label}: a whole number from ${s.number[0]} to ${s.number[1]}.`);
    }
  }
  return v;
}
