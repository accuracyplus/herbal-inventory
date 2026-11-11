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
