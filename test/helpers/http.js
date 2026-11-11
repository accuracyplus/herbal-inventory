/**
 * The Worker, called the way the app calls it: a real Request into the real worker.fetch, a real
 * SQLite database with schema.sql underneath, and a real RS256 token signed by a key whose JWKS
 * is served through the HFID binding — so sign-in is verified exactly as in production.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { TestD1 } from './d1.js';
import worker from '../../src/worker.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ORIGIN = 'https://inventory.test';
export const HP = 'u-hp';
export const HV = 'u-hv';
export const S = { main: 'st-main', sub: 'st-sub', hvMain: 'st-hv-main' };
export const AREA = { room1: 'ar-r1', room2: 'ar-r2' };

/** People, by the HiFive ID employee codes sign-in joins on. */
export const PEOPLE = {
  admin:   { id: 'p-admin',   code: 'APML131', name: 'Sinu Sureshan',   seats: { [HP]: ['UNIT_ADMIN', 'MANAGER'] }, claimRole: 'admin', group: true },
  manager: { id: 'p-manager', code: 'HPM001',  name: 'Maya Manager',    seats: { [HP]: ['MANAGER'] } },
  keeper:  { id: 'p-keeper',  code: 'HPK001',  name: 'Kiran Keeper',    seats: { [HP]: ['STOREKEEPER'] } },
  staff:   { id: 'p-staff',   code: 'HPS001',  name: 'Sara Therapist',  seats: { [HP]: ['STAFF'] }, stores: [S.sub] },
  buyer:   { id: 'p-buyer',   code: 'HPB001',  name: 'Bilal Buyer',     seats: { [HP]: ['PURCHASER'] } },
  viewer:  { id: 'p-viewer',  code: 'HPV001',  name: 'Vera Viewer',     seats: { [HP]: ['VIEWER'] } },
  hv:      { id: 'p-hv',      code: 'HVK001',  name: 'Hari Valley',     seats: { [HV]: ['STOREKEEPER', 'MANAGER'] } },
};

/** A room and a person, for tests about something else: the default unit setting needs both. */
export const FOR = { areaId: AREA.room1, personId: PEOPLE.staff.id };

let key = null;
function hfidKey() {
  if (!key) {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    key = { jwk: { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }, privateKey };
  }
  return key;
}

export function hfidToken(claims = {}) {
  const k = hfidKey();
  const now = Math.floor(Date.now() / 1000);
  const seg = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const body = `${seg({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })}.${seg({
    iss: 'hifive-id', aud: 'hifive-inventory', module: 'inventory', sub: 'hf-user', iat: now, exp: now + 3600, role: 'employee', ...claims,
  })}`;
  return `${body}.${createSign('RSA-SHA256').update(body).sign(k.privateKey, 'base64url')}`;
}

export const tokenFor = (who) => {
  const p = PEOPLE[who];
  return hfidToken({ sub: `hf-${p.id}`, emp_code: p.code, name: p.name, role: p.claimRole || 'employee', entity: 'Herbal Park' });
};

/** HiFive ID's register as the tests see it: everybody in PEOPLE, plus two codes tests add. */
export function defaultRoster() {
  return [
    ...Object.values(PEOPLE).map((p) => ({
      employee_code: p.code, full_name: p.name, entity: p.seats[HV] ? 'Herbal Valley' : 'Herbal Park',
      department: 'Spa', designation: 'Therapist', start_date: '2024-01-01', end_date: null, notice_date: null, status: 'active',
    })),
    { employee_code: 'HPNEW1', full_name: 'New Therapist', entity: 'Herbal Park', start_date: '2024-01-01', status: 'active' },
    { employee_code: 'HPNEW2', full_name: 'Nisha Nair', entity: 'Herbal Park', start_date: '2024-01-01', status: 'active' },
  ];
}

/**
 * Options: `roster` (rows /roster answers with), `rosterFails` (a status HiFive ID answers with),
 * `rosterCalls` (an array each roster request's bearer is pushed to, to check who asked).
 */
export function testEnv(extra = {}) {
  const DB = new TestD1(join(root, 'schema.sql'));
  for (const f of readdirSync(join(root, 'migrations')).filter((n) => n.endsWith('.sql')).sort()) {
    DB.exec(readFileSync(join(root, 'migrations', f), 'utf8'));
  }
  const now = new Date().toISOString();
  DB.exec(`
    INSERT INTO units (id, code, name, active, created_at) VALUES
      ('${HP}','HP','Herbal Park',1,'${now}'), ('${HV}','HV','Herbal Valley',1,'${now}');
    INSERT INTO stores (id, unit_id, code, name, kind, sort) VALUES
      ('${S.main}','${HP}','MAIN','Main store','MAIN',0), ('${S.sub}','${HP}','SUB','Spa sub store','SUB',1),
      ('${S.hvMain}','${HV}','MAIN','Main store','MAIN',0);
    INSERT INTO areas (id, unit_id, code, name) VALUES
      ('${AREA.room1}','${HP}','R1','Treatment room 1'), ('${AREA.room2}','${HP}','R2','Treatment room 2');
  `);
  for (const p of Object.values(PEOPLE)) {
    DB.db.prepare(`INSERT INTO staff (id, code, full_name, group_admin, active) VALUES (?,?,?,?,1)`).run(p.id, p.code, p.name, p.group ? 1 : 0);
    for (const [unit, roles] of Object.entries(p.seats)) {
      DB.db.prepare(`INSERT INTO staff_units (staff_id, unit_id, roles, stores, active) VALUES (?,?,?,?,1)`)
        .run(p.id, unit, JSON.stringify(roles), p.stores ? JSON.stringify(p.stores) : null);
    }
  }
  const k = hfidKey();
  return {
    DB,
    APP_ORIGIN: ORIGIN,
    HFID_ISSUER: 'hifive-id',
    HFID_AUDIENCE: 'hifive-inventory',
    HFID_JWKS_URL: 'https://hifive-id.test/.well-known/jwks.json',
    HFID: {
      fetch: async (req) => {
        const u = new URL(req.url);
        if (u.pathname === '/roster') {
          extra.rosterCalls?.push({ app: u.searchParams.get('app'), bearer: req.headers.get('authorization') });
          if (extra.rosterFails) return new Response(JSON.stringify({ error: 'unknown_app', message: 'Pass ?app=<key> naming the calling application' }), { status: extra.rosterFails });
          return new Response(JSON.stringify({ as_of: new Date().toISOString(), via: 'session', staff: extra.roster ?? defaultRoster() }));
        }
        return new Response(JSON.stringify({ keys: [k.jwk] }));
      },
    },
    ...extra,
  };
}

const ctx = () => ({ waitUntil: () => {} });

/** One request as a person (`as`), in a unit (`unit`), or with a raw `token`. */
export async function call(env, method, path, { as = 'admin', token, unit, body, origin = ORIGIN } = {}) {
  const headers = { origin };
  const t = token ?? (as ? tokenFor(as) : null);
  if (t) headers.authorization = `Bearer ${t}`;
  if (unit) headers['x-unit'] = unit;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await worker.fetch(new Request(`https://worker.test${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  }), env, ctx());
  const text = await res.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, body: parsed, headers: res.headers };
}

/** Create an item through the API, as the admin. */
export async function makeItem(env, fields = {}) {
  const res = await call(env, 'POST', '/api/items', {
    body: { code: fields.code || `IT${Math.random().toString(36).slice(2, 7)}`, name: fields.name || 'Massage oil', uom: 'bottle', category: 'Oils', ...fields },
  });
  if (res.status !== 201) throw new Error(`makeItem: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.id;
}

export async function receive(env, itemId, qty, extra = {}) {
  const res = await call(env, 'POST', '/api/receipts', {
    as: 'keeper', body: { storeId: extra.storeId || S.main, lines: [{ itemId, qty, unitCost: extra.unitCost ?? 10, expiry: extra.expiry, batchNo: extra.batchNo }] },
  });
  if (res.status !== 201) throw new Error(`receive: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export const bal = (env, storeId, itemId) =>
  env.DB.db.prepare(`SELECT qty, in_use, in_wash FROM balances WHERE store_id = ? AND item_id = ?`).get(storeId, itemId) || { qty: 0, in_use: 0, in_wash: 0 };

export const schemaPath = join(root, 'schema.sql');
export const read = (p) => readFileSync(join(root, p), 'utf8');
