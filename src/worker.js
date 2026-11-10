/**
 * HiFive Inventory — API Worker.
 *
 * One Worker, one router, one auth choke point: the HiFive Recruitment and Transport shape.
 * Every stock rule lives in src/domain/; nothing that matters is decided in this file, so a rule
 * cannot be bypassed by adding a second route later.
 *
 * Deploy:  npm run deploy
 * Schema:  npm run migrate   (wrangler d1 execute hifive-inventory --remote --file=schema.sql)
 */

import {
  resolveAuthContext, requireAssertion, requireConsoleAdmin, requireConsoleSession, AuthError, UNIT_HEADER,
} from './lib/auth.js';
import { DomainError } from './lib/errors.js';
import { nowIso, sha256Hex, text, uuid } from './lib/data.js';
import { auditNow } from './lib/audit.js';
import { hfidFetch } from './lib/hfid.js';
import { recordTrouble, troubleMessage } from './lib/trouble.js';
import { schemaStatus } from './lib/schema.js';
import { abilities, may, requireMay, ROLE_HINTS, ROLE_LABELS, RULES } from './domain/access.js';
import { categories, itemDetail, listAreas, listStores, lookup, saveItem, stockList } from './domain/catalog.js';
import { linenMove, receive, recordTransfer, recordUse } from './domain/operations.js';
import { cancelRequest, createRequest, decideRequest, fulfilRequest, getRequest, listRequests } from './domain/requests.js';
import { getPo, listPos, poAction, savePo, suggestions } from './domain/purchasing.js';
import { decideAdjustment, getAdjustment, listAdjustments, raiseAdjustment, REASONS } from './domain/adjustments.js';
import { countAction, getCount, listCounts, saveCountLines, startCount } from './domain/counts.js';
import { REPORTS } from './domain/reports.js';
import { today } from './domain/today.js';
import { allSettings } from './domain/settings.js';
import {
  auditLog, listPeople, listSuppliers, listUnits, requireGroupAdmin, saveArea, savePerson, saveSettings, saveStore,
  saveSupplier, saveUnit,
} from './domain/admin.js';
import { runImport } from './domain/importer.js';
import { pendingForStaff } from './domain/pending.js';
import { findHeld, PICK_ROLES, roleOptions, seatsFor, unitFor } from './domain/nativerole.js';
import { LINEN_FLOWS } from './domain/stock.js';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
const fail = (status, code, message, extra) => json({ error: { code, message, ...extra } }, status);

// ── Router ───────────────────────────────────────────────────────────────────

const routes = [];

/**
 * `/api/pos/:id/:action` → a matcher. Hand-rolled rather than URLPattern so the same router
 * runs in the Worker and under Node's test runner without a polyfill. Parameters are one path
 * segment each; anything else in the pattern must match exactly.
 */
function compile(pattern) {
  const names = [];
  const re = pattern.split('/').map((seg) => {
    if (seg.startsWith(':')) { names.push(seg.slice(1)); return '([^/]+)'; }
    return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  const rx = new RegExp(`^${re}$`);
  return (path) => {
    const m = rx.exec(path);
    if (!m) return null;
    return Object.fromEntries(names.map((n, i) => [n, m[i + 1]]));
  };
}
const on = (method, pattern, handler) => routes.push({ method, match: compile(pattern), handler });

/** A signed-in route: the handler gets the resolved user. */
const api = (method, pattern, handler) => on(method, pattern, async (c) => {
  const user = await resolveAuthContext(c.request, c.env);
  c.user = user;
  return handler(c, user);
});

const body = async (request) => {
  try { return await request.json(); } catch { return {}; }
};

/** The HiFive ID hub, whose morning check reads /version from every system. */
const HUB_ORIGIN = 'https://hifive-id-portal.pages.dev';
/** The HiFive ID admin console, whose browser calls /api/roles directly. */
const CONSOLE_ORIGIN = 'https://hifive-id-admin.pages.dev';

const corsHeaders = (env, request) => {
  // APP_ORIGIN is the production client; LOCAL_ORIGINS (comma-separated) is for `wrangler dev`.
  const origin = request.headers.get('Origin') || '';
  const allowed = [env.APP_ORIGIN, ...String(env.LOCAL_ORIGINS || '').split(',').map((s) => s.trim())].filter(Boolean);
  return {
    'access-control-allow-origin': allowed.includes(origin) ? origin : (env.APP_ORIGIN || '*'),
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,OPTIONS',
    // Every custom header the client sends must be listed, or the preflight refuses it (the
    // lesson of x-view-as in Transport, 4 September 2026). test/cors.test.js cross-reads this.
    'access-control-allow-headers': `authorization,content-type,${UNIT_HEADER}`,
    'access-control-max-age': '86400',
    vary: 'origin',
  };
};

export default {
  async fetch(request, env, ctx) {
    const res = await this.route(request, env, ctx);
    const out = new Response(res.body, res);
    const routeOrigin = out.headers.get('access-control-allow-origin');
    for (const [k, v] of Object.entries(corsHeaders(env, request))) out.headers.set(k, v);
    if (routeOrigin) out.headers.set('access-control-allow-origin', routeOrigin);
    const origin = request.headers.get('Origin') || '';
    const path = new URL(request.url).pathname;
    if (origin === CONSOLE_ORIGIN && path.startsWith('/api/roles/')) out.headers.set('access-control-allow-origin', CONSOLE_ORIGIN);
    if (origin === HUB_ORIGIN && path === '/version') out.headers.set('access-control-allow-origin', HUB_ORIGIN);
    return out;
  },

  async route(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
    if (url.pathname === '/health') return json({ ok: true, at: nowIso() });
    if (url.pathname === '/version') {
      const schema = await schemaStatus(env);
      const meta = env.CF_VERSION_METADATA || {};
      return json({
        ok: schema.ok, app: 'inventory',
        build: { commit: env.BUILD_COMMIT || null, version: meta.id || null, deployedAt: meta.timestamp || null },
        schema, at: nowIso(),
      }, schema.ok ? 200 : 503);
    }

    for (const r of routes) {
      if (r.method !== request.method) continue;
      const params = r.match(url.pathname);
      if (!params) continue;
      const c = { request, env, ctx, url, params };
      try {
        return await r.handler(c);
      } catch (e) {
        if (e instanceof AuthError) return fail(e.status, 'AUTH', e.message);
        if (e instanceof DomainError) return fail(e.status, e.code, e.message, e.details ? { details: e.details } : undefined);
        const ref = recordTrouble(env, ctx, e, {
          method: request.method, path: url.pathname, staffId: c.user?.staffId, actorName: c.user?.fullName, unitId: c.user?.unitId,
        });
        return fail(500, 'SERVER_ERROR', troubleMessage(ref), { ref });
      }
    }
    return fail(404, 'NOT_FOUND', 'No such endpoint.');
  },
};

// ── Sign-in ──────────────────────────────────────────────────────────────────

/**
 * HiFive ID's one-time hand-off code, swapped for the token here rather than in the page: the
 * page may only talk to this Worker (client/public/_headers), and this Worker reaches HiFive
 * ID through its service binding. The token is passed through and never kept.
 */
on('POST', '/auth/hfid/exchange', async ({ request, env }) => {
  const { code } = await body(request);
  if (!code || typeof code !== 'string') return fail(422, 'MISSING', 'There was no sign-in code to use. Sign in again.');
  const res = await hfidFetch(env, '/token/exchange', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code, app: 'inventory' }),
  });
  const out = await res.json().catch(() => null);
  if (!res.ok || !out?.token) {
    return fail(res.status >= 500 ? 503 : 401, 'HANDOFF_FAILED', res.status >= 500
      ? 'Sign-in could not be completed just now. Try again.'
      : 'That sign-in link has expired or was already used. Sign in again.');
  }
  return json({ token: out.token, exp: out.exp });
});

/**
 * Called once by the client when it arrives from HiFive ID. Records the sign-in (once per token,
 * by digest) and links the HiFive ID subject to the staff row the first time.
 */
on('POST', '/auth/hfid/arrived', async ({ request, env }) => {
  const user = await resolveAuthContext(request, env);
  const digest = (await sha256Hex((request.headers.get('authorization') || '').slice(7))).slice(0, 32);
  const seen = await env.DB.prepare(
    `SELECT 1 FROM audit_log WHERE action = 'SIGN_IN_HFID' AND detail LIKE ? AND at > datetime('now','-1 day') LIMIT 1`,
  ).bind(`%token:${digest}%`).first();
  if (seen) return json({ recorded: false });
  let linked = false;
  if (user.hfIdSub) {
    const res = await env.DB.prepare(
      `UPDATE staff SET hfid_sub = ? WHERE id = ? AND hfid_sub IS NULL
         AND NOT EXISTS (SELECT 1 FROM staff x WHERE x.hfid_sub = ? AND x.id <> ?)`,
    ).bind(user.hfIdSub, user.staffId, user.hfIdSub, user.staffId).run();
    linked = res.meta.changes === 1;
  }
  await auditNow(env, user, 'SIGN_IN_HFID', user.staffId,
    `role=${user.hfIdRole || '-'} ${linked ? 'linked hfid_sub' : ''} token:${digest}`);
  return json({ recorded: true, linked });
});

// ── HiFive ID: hub, reconciliation, console ──────────────────────────────────

on('POST', '/pending/service', async ({ request, env }) => {
  const claims = await requireAssertion(request, env, 'pending');
  const emp = String(claims.emp_code || '').trim();
  if (!emp) return fail(400, 'NO_SUBJECT', 'The assertion names nobody.');
  return json({ items: await pendingForStaff(env, emp) });
});

/** Who this app holds, for HiFive ID's weekly reconciliation. Identity and status only. */
on('GET', '/api/roster', async ({ request, env }) => {
  await requireConsoleAdmin(request, env);
  const { results } = await env.DB.prepare(
    `SELECT s.code, s.full_name, s.active,
            (SELECT group_concat(u.name || ': ' || su.roles, '; ') FROM staff_units su JOIN units u ON u.id = su.unit_id
              WHERE su.staff_id = s.id AND su.active = 1) AS seats
       FROM staff s ORDER BY s.code`,
  ).all();
  const people = (results || []).map((s) => ({
    emp_code: String(s.code).trim(), name: s.full_name, active: !!s.active, status: s.active ? 'active' : 'inactive',
    role: String(s.seats || '').replace(/[[\]"]/g, ''),
  }));
  return json({ app: 'inventory', count: people.length, people });
});

// The console reads `d.message || d.error`, so these answer in its shape, not this API's.
const consoleRefuse = (status, error, message, extra) => json({ error, message, ...extra }, status);
const empCodeOf = (params) => { try { return decodeURIComponent(params.empId).trim(); } catch { return String(params.empId).trim(); } };
const consoleActor = (claims) => `${claims.name || claims.email || claims.sub} (HiFive ID console)`;

on('GET', '/api/roles/:empId', async ({ request, env, params }) => {
  await requireConsoleSession(request, env);
  const row = await findHeld(env, empCodeOf(params));
  if (!row) return json({ error: 'not_found', options: roleOptions(), writable: true, creates: true }, 404);
  const seats = (await seatsFor(env, row.id)).filter((s) => s.active);
  const single = seats.length === 1 && seats[0].roles.length === 1;
  return json({
    role: single ? seats[0].roles[0] : (seats[0]?.roles[0] ?? ''),
    detail: seats.map((s) => `${s.unit}: ${s.roles.map((r) => ROLE_LABELS[r] || r).join(', ')}`).join(' · ')
      + (single || !seats.length ? '' : ' · Change these on Inventory\'s People screen'),
    writable: single || !seats.length,
    options: roleOptions(),
  });
});

on('PUT', '/api/roles/:empId', async ({ request, env, params }) => {
  const claims = await requireConsoleSession(request, env);
  const code = empCodeOf(params).toUpperCase();
  const b = await body(request);
  const role = String(b?.role ?? '').trim();
  if (!PICK_ROLES.includes(role)) {
    return consoleRefuse(422, 'role_refused', role === 'UNIT_ADMIN'
      ? 'Unit administrator is given on Inventory\'s People screen, not from the console.'
      : `"${role}" is not a role in HiFive Inventory.`);
  }
  const by = consoleActor(claims);
  const now = nowIso();
  let row = await findHeld(env, code);
  if (!row) {
    const person = b?.person;
    if (!person) return consoleRefuse(404, 'not_found', `${code} is not in HiFive Inventory. Send their details with the role to create them here.`, { options: roleOptions(), creates: true });
    if (person.emp_code && String(person.emp_code).trim().toUpperCase() !== code) return consoleRefuse(422, 'code_mismatch', `The details sent are for ${person.emp_code}, not ${code}.`);
    const name = text(person.full_name, 120);
    if (!name) return consoleRefuse(422, 'name_required', `A name is needed to create ${code} here.`);
    const unit = await unitFor(env, [person.entity]);
    if (!unit) return consoleRefuse(409, 'no_entity', `HiFive Inventory cannot tell which unit ${name} belongs to: HiFive ID says "${person.entity ?? 'none'}". Add them on Inventory's People screen.`);
    const id = uuid();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO staff (id, code, full_name, active, updated_at, updated_by) VALUES (?,?,?,1,?,?)`).bind(id, code, name, now, by),
      env.DB.prepare(`INSERT INTO staff_units (staff_id, unit_id, roles, active, updated_at, updated_by) VALUES (?,?,?,1,?,?)`).bind(id, unit.id, JSON.stringify([role]), now, by),
    ]);
    await auditNow(env, { fullName: by }, 'SEAT_SET_CONSOLE', code, `${role} in ${unit.name} (created)`, unit.id);
    return json({ ok: true, created: true, role, entity: unit.name }, 201);
  }
  const seats = (await seatsFor(env, row.id)).filter((s) => s.active);
  if (seats.length > 1 || (seats[0] && seats[0].roles.length > 1)) {
    return consoleRefuse(409, 'several_roles', `${row.full_name} holds several roles here, and one choice would wipe the rest. Change them on Inventory's People screen.`);
  }
  if (seats[0]?.roles[0] === role) return json({ ok: true, unchanged: true });
  if (seats[0]?.roles[0] === 'UNIT_ADMIN') {
    return consoleRefuse(422, 'role_refused', `${row.full_name} is a unit administrator. Change that on Inventory's People screen, where the last administrator is protected.`);
  }
  let unitId = seats[0]?.unit_id;
  if (!unitId) {
    const unit = await unitFor(env, [b?.person?.entity]);
    if (!unit) return consoleRefuse(409, 'no_entity', `HiFive Inventory cannot tell which unit ${row.full_name} belongs to. Add them on Inventory's People screen.`);
    unitId = unit.id;
  }
  await env.DB.prepare(
    `INSERT INTO staff_units (staff_id, unit_id, roles, active, updated_at, updated_by) VALUES (?,?,?,1,?,?)
     ON CONFLICT(staff_id, unit_id) DO UPDATE SET roles = excluded.roles, active = 1, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).bind(row.id, unitId, JSON.stringify([role]), now, by).run();
  await auditNow(env, { fullName: by }, 'SEAT_SET_CONSOLE', code, `${seats[0]?.roles[0] ?? 'no role'} to ${role}`, unitId);
  return json({ ok: true });
});

// ── Me ───────────────────────────────────────────────────────────────────────

api('GET', '/api/me', async ({ env }, user) => {
  const settings = await allSettings(env, user.unitId);
  return json({
    staffId: user.staffId, code: user.code, name: user.fullName, groupAdmin: user.groupAdmin,
    unit: user.unit, units: user.units, roles: user.roles, stores: user.stores,
    can: abilities(user),
    settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    labels: { roles: ROLE_LABELS, hints: ROLE_HINTS, reasons: REASONS, rules: RULES, linenFlows: LINEN_FLOWS },
  });
});

api('GET', '/api/today', async ({ env }, user) => json(await today(env, user)));

// ── Stock ────────────────────────────────────────────────────────────────────

api('GET', '/api/stock', async ({ env, url }, user) => json(await stockList(env, user, {
  includeInactive: url.searchParams.get('inactive') === '1' && may(user, 'items.edit'),
})));
api('GET', '/api/items/:id', async ({ env, params }, user) => json(await itemDetail(env, user, params.id)));
api('GET', '/api/lookup', async ({ env, url }, user) => {
  const hit = await lookup(env, user, url.searchParams.get('code'));
  return hit ? json(hit) : fail(404, 'NOT_FOUND', 'No item with that code or barcode in this unit.');
});
api('GET', '/api/stores', async ({ env, url }, user) => json(await listStores(env, user, { all: url.searchParams.get('all') === '1' })));
api('GET', '/api/areas', async ({ env, url }, user) => json(await listAreas(env, user, { all: url.searchParams.get('all') === '1' })));
api('GET', '/api/categories', async ({ env }, user) => json(await categories(env, user)));
api('GET', '/api/suppliers', async ({ env, url }, user) => json(await listSuppliers(env, user, { all: url.searchParams.get('all') === '1' })));
api('GET', '/api/batches', async ({ env, url }, user) => {
  const { results } = await env.DB.prepare(
    `SELECT bt.id, bt.batch_no, bt.expiry, bt.qty FROM batches bt JOIN stores s ON s.id = bt.store_id
      WHERE s.unit_id = ? AND bt.store_id = ? AND bt.item_id = ? AND bt.qty > 0
      ORDER BY CASE WHEN bt.expiry = '' THEN 1 ELSE 0 END, bt.expiry`,
  ).bind(user.unitId, url.searchParams.get('store') || '', url.searchParams.get('item') || '').all();
  return json(results || []);
});

// ── Everyday actions ─────────────────────────────────────────────────────────

api('POST', '/api/use', async ({ request, env }, user) => { requireMay(user, 'stock.use'); return json(await recordUse(env, user, await body(request)), 201); });
api('POST', '/api/transfers', async ({ request, env }, user) => { requireMay(user, 'transfer'); return json(await recordTransfer(env, user, await body(request)), 201); });
api('POST', '/api/receipts', async ({ request, env }, user) => { requireMay(user, 'receive'); return json(await receive(env, user, await body(request)), 201); });
api('POST', '/api/linen', async ({ request, env }, user) => { requireMay(user, 'stock.use'); return json(await linenMove(env, user, await body(request)), 201); });
api('GET', '/api/linen', async ({ env }, user) => {
  const { results } = await env.DB.prepare(
    `SELECT i.id, i.code, i.name, s.id AS store_id, s.name AS store_name, COALESCE(b.qty,0) AS available,
            COALESCE(b.in_use,0) AS in_use, COALESCE(b.in_wash,0) AS in_wash,
            (SELECT MAX(at) FROM movements m WHERE m.item_id = i.id AND m.store_id = s.id AND m.kind = 'LINEN' AND m.from_state = 'in_wash') AS last_back
       FROM items i JOIN balances b ON b.item_id = i.id JOIN stores s ON s.id = b.store_id
      WHERE i.unit_id = ? AND i.is_linen = 1 AND i.active = 1 ORDER BY s.name, i.name`,
  ).bind(user.unitId).all();
  const { results: recent } = await env.DB.prepare(
    `SELECT m.at, m.qty, m.from_state, m.to_state, i.name, s.name AS store_name, a.name AS area_name, m.actor_name, m.reason
       FROM movements m JOIN items i ON i.id = m.item_id JOIN stores s ON s.id = m.store_id LEFT JOIN areas a ON a.id = m.area_id
      WHERE m.unit_id = ? AND m.kind = 'LINEN' ORDER BY m.at DESC LIMIT 30`,
  ).bind(user.unitId).all();
  const { results: linenItems } = await env.DB.prepare(
    `SELECT id, code, name FROM items WHERE unit_id = ? AND is_linen = 1 AND active = 1 ORDER BY name`,
  ).bind(user.unitId).all();
  return json({ rows: results || [], recent: recent || [], items: linenItems || [] });
});

// ── Requests ─────────────────────────────────────────────────────────────────

api('GET', '/api/requests', async ({ env, url }, user) => json(await listRequests(env, user, {
  status: url.searchParams.get('status') || null,
  // Staff see their own; anyone who decides or fulfils sees the unit's.
  mine: url.searchParams.get('mine') === '1' || !(may(user, 'request.decide') || may(user, 'request.fulfil') || may(user, 'reports')),
})));
api('POST', '/api/requests', async ({ request, env }, user) => { requireMay(user, 'request.create'); return json(await createRequest(env, user, await body(request)), 201); });
api('GET', '/api/requests/:id', async ({ env, params }, user) => {
  const r = await getRequest(env, user, params.id);
  if (r.requested_by !== user.staffId && !(may(user, 'request.decide') || may(user, 'request.fulfil') || may(user, 'reports'))) {
    return fail(404, 'NOT_FOUND', 'That request does not exist in this unit.');
  }
  return json(r);
});
api('POST', '/api/requests/:id/decide', async ({ request, env, params }, user) => { requireMay(user, 'request.decide'); return json(await decideRequest(env, user, params.id, await body(request))); });
api('POST', '/api/requests/:id/issue', async ({ request, env, params }, user) => { requireMay(user, 'request.fulfil'); return json(await fulfilRequest(env, user, params.id, await body(request))); });
api('POST', '/api/requests/:id/cancel', async ({ request, env, params }, user) => json(await cancelRequest(env, user, params.id, await body(request))));

// ── Purchasing ───────────────────────────────────────────────────────────────

const PO_VIEW = (user) => may(user, 'po.edit') || may(user, 'po.decide') || may(user, 'receive') || may(user, 'reports');
api('GET', '/api/pos', async ({ env, url }, user) => {
  if (!PO_VIEW(user)) return fail(403, 'AUTH', 'Your role does not allow this.');
  return json(await listPos(env, user, { status: url.searchParams.get('status') || null }));
});
api('GET', '/api/pos/suggestions', async ({ env, url }, user) => {
  if (!(may(user, 'po.edit') || may(user, 'request.create'))) return fail(403, 'AUTH', 'Your role does not allow this.');
  return json(await suggestions(env, user, url.searchParams.get('store')));
});
api('POST', '/api/pos', async ({ request, env }, user) => { requireMay(user, 'po.edit'); return json(await savePo(env, user, await body(request)), 201); });
api('GET', '/api/pos/:id', async ({ env, params }, user) => {
  if (!PO_VIEW(user)) return fail(403, 'AUTH', 'Your role does not allow this.');
  return json(await getPo(env, user, params.id));
});
api('PUT', '/api/pos/:id', async ({ request, env, params }, user) => { requireMay(user, 'po.edit'); return json(await savePo(env, user, await body(request), params.id)); });
api('POST', '/api/pos/:id/:action', async ({ request, env, params }, user) => {
  const action = params.action;
  requireMay(user, ['approve', 'reject'].includes(action) ? 'po.decide' : action === 'close' ? 'receive' : 'po.edit');
  return json(await poAction(env, user, params.id, action, await body(request)));
});

// ── Corrections ──────────────────────────────────────────────────────────────

api('GET', '/api/adjustments', async ({ env, url }, user) => {
  if (!(may(user, 'adjust.raise') || may(user, 'adjust.decide') || may(user, 'reports'))) return fail(403, 'AUTH', 'Your role does not allow this.');
  return json(await listAdjustments(env, user, { status: url.searchParams.get('status') || null }));
});
api('POST', '/api/adjustments', async ({ request, env }, user) => { requireMay(user, 'adjust.raise'); return json(await raiseAdjustment(env, user, await body(request)), 201); });
api('GET', '/api/adjustments/:id', async ({ env, params }, user) => {
  if (!(may(user, 'adjust.raise') || may(user, 'adjust.decide') || may(user, 'reports'))) return fail(403, 'AUTH', 'Your role does not allow this.');
  return json(await getAdjustment(env, user, params.id));
});
api('POST', '/api/adjustments/:id/decide', async ({ request, env, params }, user) => {
  const b = await body(request);
  if (b.action !== 'CANCEL') requireMay(user, 'adjust.decide');
  return json(await decideAdjustment(env, user, params.id, b));
});

// ── Counts ───────────────────────────────────────────────────────────────────

const COUNT_VIEW = (user) => may(user, 'count.run') || may(user, 'count.decide') || may(user, 'reports');
api('GET', '/api/counts', async ({ env }, user) => {
  if (!COUNT_VIEW(user)) return fail(403, 'AUTH', 'Your role does not allow this.');
  return json(await listCounts(env, user));
});
api('POST', '/api/counts', async ({ request, env }, user) => { requireMay(user, 'count.run'); return json(await startCount(env, user, await body(request)), 201); });
api('GET', '/api/counts/:id', async ({ env, params }, user) => {
  if (!COUNT_VIEW(user)) return fail(403, 'AUTH', 'Your role does not allow this.');
  return json(await getCount(env, user, params.id));
});
api('PUT', '/api/counts/:id/lines', async ({ request, env, params }, user) => { requireMay(user, 'count.run'); return json(await saveCountLines(env, user, params.id, await body(request))); });
api('POST', '/api/counts/:id/:action', async ({ request, env, params }, user) => {
  requireMay(user, ['approve', 'reopen'].includes(params.action) ? 'count.decide' : 'count.run');
  return json(await countAction(env, user, params.id, params.action, await body(request)));
});

// ── Reports ──────────────────────────────────────────────────────────────────

api('GET', '/api/reports/:name', async ({ env, url, params }, user) => {
  requireMay(user, 'reports');
  const fn = REPORTS[params.name];
  if (!fn) return fail(404, 'NOT_FOUND', 'No such report.');
  if (params.name === 'purchases') requireMay(user, 'cost.view');
  return json(await fn(env, user, url));
});
api('GET', '/api/legacy', async ({ env, url }, user) => {
  requireMay(user, 'reports');
  const q = text(url.searchParams.get('q'), 60);
  const { results } = await env.DB.prepare(
    `SELECT at, type, item_name, qty, store, staff, purpose, remarks FROM legacy_movements
      WHERE unit_id = ? ${q ? 'AND (item_name LIKE ? OR staff LIKE ? OR purpose LIKE ?)' : ''}
      ORDER BY at DESC LIMIT 2000`,
  ).bind(user.unitId, ...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [])).all();
  return json(results || []);
});

// ── Item list and administration ─────────────────────────────────────────────

api('POST', '/api/items', async ({ request, env }, user) => { requireMay(user, 'items.edit'); return json(await saveItem(env, user, await body(request)), 201); });
api('PUT', '/api/items/:id', async ({ request, env, params }, user) => { requireMay(user, 'items.edit'); return json(await saveItem(env, user, await body(request), params.id)); });
api('POST', '/api/suppliers', async ({ request, env }, user) => { requireMay(user, 'supplier.edit'); return json(await saveSupplier(env, user, await body(request)), 201); });
api('PUT', '/api/suppliers/:id', async ({ request, env, params }, user) => { requireMay(user, 'supplier.edit'); return json(await saveSupplier(env, user, await body(request), params.id)); });
api('POST', '/api/stores', async ({ request, env }, user) => { requireMay(user, 'admin'); return json(await saveStore(env, user, await body(request)), 201); });
api('PUT', '/api/stores/:id', async ({ request, env, params }, user) => { requireMay(user, 'admin'); return json(await saveStore(env, user, await body(request), params.id)); });
api('POST', '/api/areas', async ({ request, env }, user) => { requireMay(user, 'admin'); return json(await saveArea(env, user, await body(request)), 201); });
api('PUT', '/api/areas/:id', async ({ request, env, params }, user) => { requireMay(user, 'admin'); return json(await saveArea(env, user, await body(request), params.id)); });
api('GET', '/api/people', async ({ env }, user) => { requireMay(user, 'admin'); return json(await listPeople(env, user)); });
api('PUT', '/api/people', async ({ request, env }, user) => { requireMay(user, 'admin'); return json(await savePerson(env, user, await body(request))); });
api('GET', '/api/settings', async ({ env }, user) => json(await allSettings(env, user.unitId)));
api('PUT', '/api/settings', async ({ request, env }, user) => { requireMay(user, 'admin'); return json(await saveSettings(env, user, await body(request))); });
api('GET', '/api/audit', async ({ env, url }, user) => { requireMay(user, 'admin'); return json(await auditLog(env, user, { q: text(url.searchParams.get('q'), 60) })); });
api('POST', '/api/import', async ({ request, env }, user) => { requireMay(user, 'admin'); return json(await runImport(env, user, await body(request))); });

api('GET', '/api/units', async ({ env }, user) => { requireGroupAdmin(user); return json(await listUnits(env)); });
api('POST', '/api/units', async ({ request, env }, user) => json(await saveUnit(env, user, await body(request)), 201));
api('PUT', '/api/units/:id', async ({ request, env, params }, user) => json(await saveUnit(env, user, await body(request), params.id)));

