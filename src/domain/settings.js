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
    labels: { required: 'Yes — a manager approves first', none: 'No — on the shelf when recorded' },
  },
  'receipts.note': {
    label: 'A delivery needs its delivery note attached',
    hint: 'A photo or PDF of the delivery note, or the invoice for a purchase with no note, before it can be approved.',
    options: ['required', 'optional'], default: 'required',
    labels: { required: 'Yes — cannot be approved without it', optional: 'No — it can be approved without' },
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
};

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
