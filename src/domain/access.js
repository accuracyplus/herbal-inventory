/**
 * Who may do what, in one table.
 *
 * Every endpoint asks `may(user, action)` rather than listing roles itself, so the answer to
 * "can a store keeper approve an adjustment?" lives in exactly one place and the Help screen
 * can print the same table the server enforces.
 */

import { AuthError } from '../lib/errors.js';
import { refuse } from '../lib/errors.js';

export const ROLE_LABELS = {
  STAFF: 'Staff',
  STOREKEEPER: 'Store keeper',
  PURCHASER: 'Purchasing',
  MANAGER: 'Manager',
  UNIT_ADMIN: 'Unit administrator',
  VIEWER: 'Viewer (read-only)',
  IT: 'IT',
  HR: 'HR',
  ACCOUNTS: 'Accounts',
};

export const ROLE_HINTS = {
  STAFF: 'Records what they use, moves linen, and requests stock.',
  STOREKEEPER: 'Runs the stores: receives deliveries, transfers, fulfils requests, counts stock, raises corrections.',
  PURCHASER: 'Keeps suppliers and raises purchase orders; can receive deliveries.',
  MANAGER: 'Approves requests, purchase orders, corrections and counts; sees costs and reports; keeps the item list.',
  UNIT_ADMIN: 'Everything a manager does, plus stores, areas, people, settings and the import.',
  VIEWER: 'Sees stock and reports; records nothing.',
  IT: 'Runs the IT register: devices, SIMs and licences, who holds them, hand-overs and exit clearance; raises IT purchase requests.',
  HR: 'Raises new email account requests to IT and sees what IT assets cost.',
  ACCOUNTS: 'Gives the second approval on IT purchase requests, after the unit head, and sees what IT costs.',
};

const ALL = ['STAFF', 'STOREKEEPER', 'PURCHASER', 'MANAGER', 'UNIT_ADMIN', 'VIEWER', 'IT', 'HR', 'ACCOUNTS'];
const OPS = ['STOREKEEPER', 'MANAGER', 'UNIT_ADMIN'];
const DECIDE = ['MANAGER', 'UNIT_ADMIN'];

export const RULES = {
  'stock.view':        ALL,
  'stock.use':         ['STAFF', ...OPS],                  // record use, move linen
  'use.for_others':    OPS,                                // say that somebody else used it
  'custody.team':      DECIDE,                             // see and settle what the team holds
  'cost.people':       DECIDE,                             // cost per person, by name
  'cost.view':         ['PURCHASER', 'MANAGER', 'UNIT_ADMIN', 'VIEWER'],
  'request.create':    ['STAFF', 'STOREKEEPER', 'PURCHASER', 'MANAGER', 'UNIT_ADMIN'],
  'request.decide':    DECIDE,
  'request.fulfil':    OPS,
  'transfer':          OPS,
  'receive':           [...OPS, 'PURCHASER'],
  'receipt.decide':    DECIDE,                             // approve a delivery somebody else recorded
  'adjust.raise':      OPS,
  'adjust.decide':     DECIDE,
  'count.run':         OPS,
  'count.decide':      DECIDE,
  'po.edit':           ['PURCHASER', ...DECIDE],
  'po.decide':         DECIDE,
  'po.send':           ['PURCHASER', ...DECIDE],           // email an approved order to its supplier
  'supplier.edit':     ['PURCHASER', ...DECIDE],
  'items.edit':        DECIDE,
  'services.edit':     DECIDE,                             // services and what each normally uses
  'barcode.link':      ['STOREKEEPER', 'PURCHASER', ...DECIDE], // say which item an unknown barcode is
  'reports':           ['STOREKEEPER', 'PURCHASER', 'MANAGER', 'UNIT_ADMIN', 'VIEWER'],
  // Feature 14, each used only where the unit has switched the feature on.
  'inspect':           DECIDE,                             // release held stock, or reject it
  'return.raise':      [...OPS, 'PURCHASER'],              // send goods back against a delivery
  'return.decide':     DECIDE,
  'assets.edit':       OPS,                                // the equipment register and its services
  // The IT register (D-086, 22 Nov 2026). Who holds which laptop or SIM is for these roles, not
  // for everybody who sees stock; what IT costs is for IT, HR and the directors only.
  'it.view':           ['IT', 'HR', 'ACCOUNTS', 'MANAGER', 'UNIT_ADMIN', 'VIEWER'],
  'it.edit':           ['IT', 'UNIT_ADMIN'],              // devices, SIMs, licences, hand-overs, clearance
  'it.prices':         ['IT', 'HR', 'ACCOUNTS'],          // and the directors: see may()
  'it.purchase':       ['IT'],                            // raise a purchase request
  // Approving one is two steps (Sinu, 27 Nov 2026): the facility's unit head first, read from
  // HiFive ID's facility contacts when they act (lib/unitheads.js, not a role here), then Accounts.
  'it.accounts':       ['ACCOUNTS'],                      // the second approval
  'it.email':          ['HR'],                            // raise a new email account request to IT
  'accounts':          ['PURCHASER', 'MANAGER', 'UNIT_ADMIN', 'VIEWER'],  // exports for the accounts system
  'admin':             ['UNIT_ADMIN'],
};

/** Rules the directors (group summary) hold in every unit as well as the roles named. */
const DIRECTORS_TOO = new Set(['it.prices']);

export function may(user, action) {
  const allowed = RULES[action];
  if (!allowed) return false;
  if (DIRECTORS_TOO.has(action) && user.groupSummary) return true;
  return user.roles.some((r) => allowed.includes(r));
}

export function requireMay(user, action) {
  if (!may(user, action)) throw new AuthError('Your role does not allow this.', 403);
}

/** Everything this person may do, for the client to show and hide screens by. */
export function abilities(user) {
  return Object.keys(RULES).filter((a) => may(user, a));
}

/**
 * A store in this person's unit that they may record against.
 *
 * `user.stores` is null for "every store in the unit", or a list of ids. Store keepers and
 * managers normally have null; a therapist can be tied to the spa's sub store so the main
 * store's shelf is not emptied from a treatment room.
 */
export async function storeFor(env, user, storeId, { forWrite = true } = {}) {
  if (!storeId) refuse('STORE_REQUIRED', 'Choose a store.');
  const store = await env.DB.prepare(
    `SELECT id, unit_id, code, name, kind, active FROM stores WHERE id = ? AND unit_id = ?`,
  ).bind(storeId, user.unitId).first();
  // Another unit's store is answered as if it did not exist.
  if (!store) refuse('NOT_FOUND', 'That store does not exist in this unit.', 404);
  if (forWrite && !store.active) refuse('STORE_CLOSED', `${store.name} is closed. Choose another store.`);
  if (forWrite && user.stores && !user.stores.includes(store.id)) {
    refuse('STORE_NOT_YOURS', `You are not set up to record against ${store.name}. Ask your unit administrator.`, 403);
  }
  return store;
}

export async function areaFor(env, user, areaId) {
  if (!areaId) return null;
  const area = await env.DB.prepare(
    `SELECT id, code, name, active, department_id FROM areas WHERE id = ? AND unit_id = ?`,
  ).bind(areaId, user.unitId).first();
  if (!area) refuse('NOT_FOUND', 'That room or area does not exist in this unit.', 404);
  return area;
}

/**
 * Four eyes.
 *
 * Somebody may not approve what they raised themselves — unless they are the only person in the
 * unit who can approve anything, in which case refusing would leave the unit stuck. Group
 * administrators are not counted as the "other" approver: they are not there day to day.
 */
export async function requireOtherApprover(env, user, raisedBy, what) {
  if (raisedBy !== user.staffId) return;
  const { results } = await env.DB.prepare(
    `SELECT su.staff_id, su.roles FROM staff_units su JOIN staff s ON s.id = su.staff_id
      WHERE su.unit_id = ? AND su.active = 1 AND s.active = 1 AND su.staff_id <> ?`,
  ).bind(user.unitId, user.staffId).all();
  const another = (results || []).some((r) => /"(MANAGER|UNIT_ADMIN)"/.test(r.roles || ''));
  if (another) {
    refuse('FOUR_EYES', `You raised this ${what}, so somebody else has to approve it.`, 403);
  }
}
