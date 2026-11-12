/**
 * Talking to the Worker, and signing in through HiFive ID.
 *
 * The sign-in contract is HiFive Transport's, verified against the live service there: send the
 * person to HiFive ID's /login with `app=inventory`, a provider and a redirect back here; they
 * return with a one-time `?hfid_code=`, which this page asks its own Worker to swap for the
 * token (the page may only talk to that Worker). The older `?hfid_token=` is still read.
 */

export const API = import.meta.env.VITE_API || '';
const HFID_ORIGIN = import.meta.env.VITE_HFID_ORIGIN || 'https://hifive-id.sinusuresh.workers.dev';
const TOKEN_KEY = 'hifive-inventory.token';
const UNIT_KEY = 'hifive-inventory.unit';
const RETURN_KEY = 'hifive-inventory.return';

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return sessionStorage.getItem(k); } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { sessionStorage.setItem(k, v); } },
  del(k) { try { localStorage.removeItem(k); } catch { /* private window */ } sessionStorage.removeItem(k); },
};

export const token = { get: () => store.get(TOKEN_KEY), set: (t) => store.set(TOKEN_KEY, t), clear: () => store.del(TOKEN_KEY) };
export const unitPref = { get: () => store.get(UNIT_KEY), set: (u) => store.set(UNIT_KEY, u), clear: () => store.del(UNIT_KEY) };

/** `provider` keeps HiFive ID from dropping the person on its own hub (see Transport's api.js). */
export function hfidLoginUrl(provider) {
  const u = new URL('/login', HFID_ORIGIN);
  u.searchParams.set('app', 'inventory');
  if (provider) u.searchParams.set('provider', provider);
  u.searchParams.set('redirect', `${location.origin}/`);
  return u.toString();
}

export function rememberAddress() {
  const to = location.pathname + location.search + location.hash;
  if (to === '/' || to === '/#' || to === '') return;
  store.set(RETURN_KEY, JSON.stringify({ to, at: Date.now() }));
}

function arrive(t, params) {
  token.set(t);
  let back = null;
  try {
    const saved = JSON.parse(store.get(RETURN_KEY) || 'null');
    // A link followed within the last half hour is still the place the person meant to go.
    if (saved && Date.now() - saved.at < 30 * 60 * 1000 && String(saved.to).startsWith('/')) back = saved.to;
    store.del(RETURN_KEY);
  } catch { /* none */ }
  const rest = params.toString();
  history.replaceState(null, '', back || location.pathname + (rest ? `?${rest}` : '') + location.hash);
  return t;
}

/** Take a fresh sign-in out of the address bar. Resolves the token, or null when there was none. */
export async function captureSignIn() {
  const params = new URLSearchParams(location.search);
  const code = params.get('hfid_code');
  const legacy = params.get('hfid_token');
  if (!code && !legacy) return null;
  params.delete('hfid_code');
  params.delete('hfid_token');
  params.delete('hfid_exp');
  const rest = params.toString();
  history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
  if (legacy) return arrive(legacy, params);
  const { token: t } = await request('/auth/hfid/exchange', { method: 'POST', body: { code }, noUnit: true });
  return arrive(t, params);
}

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** `form` sends files: an object of fields, where a File or Blob goes as a file. `blob` returns the bytes. */
export async function request(path, { method = 'GET', body, form, blob = false, noUnit = false } = {}) {
  let res;
  let payload;
  if (form) {
    payload = new FormData();
    for (const [k, v] of Object.entries(form)) {
      if (v === null || v === undefined || v === '') continue;
      if (v instanceof Blob) payload.append(k, v, v.name || 'file'); else payload.append(k, String(v));
    }
  } else if (body !== undefined) payload = JSON.stringify(body);
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(token.get() ? { authorization: `Bearer ${token.get()}` } : {}),
        ...(!noUnit && unitPref.get() ? { 'x-unit': unitPref.get() } : {}),
        // A form sets its own content type, with the boundary the browser chose.
        ...(body !== undefined && !form ? { 'content-type': 'application/json' } : {}),
      },
      body: payload,
    });
  } catch {
    throw new ApiError(navigator.onLine === false
      ? 'You are offline. Nothing was recorded — try again when you are back online.'
      : 'Could not reach HiFive Inventory. Check your connection and try again.', 0, 'NETWORK');
  }
  if (blob && res.ok) return res.blob();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data?.error?.message || 'Something went wrong.', res.status, data?.error?.code, data?.error?.details);
  }
  return data;
}

export const get = (path) => request(path);
export const post = (path, body = {}) => request(path, { method: 'POST', body });
export const put = (path, body = {}) => request(path, { method: 'PUT', body });
export const sendForm = (path, form) => request(path, { method: 'POST', form });

/**
 * A photo made small enough to send from a phone on a weak signal: at most `max` pixels on its
 * long side, as JPEG. A PDF, or a picture this browser cannot open, is sent as it is.
 */
export async function shrinkImage(file, max = 2000, quality = 0.85) {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const out = await new Promise((done) => canvas.toBlob(done, 'image/jpeg', quality));
    if (!out || (file.type === 'image/jpeg' && out.size >= file.size)) return file;
    return new File([out], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/**
 * Open an attached file in a new tab. The tab is opened first, while the tap still counts as one
 * (a phone's browser blocks a window opened after waiting), and pointed at the file once it has
 * arrived. Files are fetched with the person's sign-in; they have no address of their own.
 */
export const openFile = (id, name) => openPath(`/api/files/${id}`, name);

/** Any file the Worker hands back (an order's PDF), opened the same way. */
export async function openPath(path, name) {
  const tab = window.open('', '_blank');
  try {
    const url = URL.createObjectURL(await request(path, { blob: true }));
    if (tab) tab.location = url;
    else { const a = document.createElement('a'); a.href = url; a.download = name || 'file'; document.body.appendChild(a); a.click(); a.remove(); }
    setTimeout(() => URL.revokeObjectURL(url), 60e3);
  } catch (e) {
    tab?.close();
    throw e;
  }
}

// ── Formatting ───────────────────────────────────────────────────────────────

const GST = 'Asia/Dubai';

export const fmtQty = (n) => {
  if (n === null || n === undefined || n === '') return '—';
  const v = Number(n);
  return Number.isInteger(v) ? v.toLocaleString('en-AE') : v.toLocaleString('en-AE', { maximumFractionDigits: 3 });
};

export const fmtMoney = (n, currency = 'AED', digits = 2) => {
  if (n === null || n === undefined) return '—';
  return `${currency} ${Number(n).toLocaleString('en-AE', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00+04:00`) : new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: GST });
};

export const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: GST });
};

export const fmtAgo = (iso) => {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
};

export const gstToday = (offsetDays = 0) => new Date(Date.now() + offsetDays * 864e5 + 4 * 3600e3).toISOString().slice(0, 10);

/** Rows to a CSV the person's Excel opens directly (BOM for Arabic and Malayalam names). */
export function downloadCsv(filename, rows, columns) {
  const cols = columns || Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k }));
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.map((c) => esc(c.label)).join(','), ...rows.map((r) => cols.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(','))];
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
