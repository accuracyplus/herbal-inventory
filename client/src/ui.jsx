/**
 * The shared pieces every screen is built from, using only the HiFive design tokens.
 *
 * Named after the Design Guide's components where one exists: Tile (C4), StatusRows (C7),
 * Hint (C8), Sheet (C9). Everything else is the plain kit a stock app needs: fields, tables,
 * pills, an item picker and a line editor.
 */

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import Icon from './icons.jsx';
import { fmtQty, get } from './api.js';

// ── App context ──────────────────────────────────────────────────────────────

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

/** Fetch a path; `reload` refetches. Errors are kept, not thrown, so a screen can say them. */
export function useData(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const tick = useRef(0);
  const load = useCallback(async () => {
    if (!path) return;
    const mine = ++tick.current;
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await get(path);
      if (mine === tick.current) setState({ data, error: null, loading: false });
    } catch (e) {
      if (mine === tick.current) setState({ data: null, error: e, loading: false });
    }
  }, [path, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

// ── Layout ───────────────────────────────────────────────────────────────────

export function Page({ title, subtitle, actions, children, back }) {
  return (
    <div className="page">
      <header className="page-head">
        <div className="page-title">
          {back && <button className="icon-btn" onClick={back} aria-label="Back"><Icon name="back" /></button>}
          <div className="min0">
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Card({ title, hint, actions, children, className = '', pad = true }) {
  return (
    <section className={`card ${pad ? '' : 'nopad'} ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <h2 className="caption">{title}{hint && <Hint text={hint} />}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** C4 · Tile: one live number with its label. */
export function Tile({ icon, value, label, tone = 'brand', onClick, hint }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`tile tone-${tone}`} onClick={onClick}>
      <span className="tile-icon"><Icon name={icon} size={18} /></span>
      <span className="tile-value">{value}</span>
      <span className="tile-label">{label}{hint && <Hint text={hint} />}</span>
    </Tag>
  );
}

/** C7 · Status rows: icon | label, with the value as a sub-line. */
export function StatusRows({ rows }) {
  return (
    <ul className="status-rows">
      {rows.map((r) => (
        <li key={r.key}>
          <button className="status-row" onClick={r.onClick} disabled={!r.onClick}>
            <span className={`row-icon tone-${r.tone || 'brand'}`}><Icon name={r.icon} size={18} /></span>
            <span className="min0 grow">
              <span className="row-label">{r.label}{r.flag && <span className="row-flag">{r.flag}</span>}</span>
              {r.sub && <span className="row-sub">{r.sub}</span>}
            </span>
            {r.onClick && <Icon name="chevron" size={16} className="faint" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Rule 3: an empty section collapses to one friendly line, never an empty box. */
export function Quiet({ children, icon = 'check' }) {
  return <p className="quiet"><Icon name={icon} size={16} />{children}</p>;
}

/** C8 · Hint: a "?" that opens one to three sentences. */
export function Hint({ text: body }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  return (
    <span className="hint" ref={ref}>
      <button type="button" className="hint-btn" aria-label="What is this?" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>?</button>
      {open && <span className="hint-pop" role="tooltip">{body}</span>}
    </span>
  );
}

/** C9 · Sheet: bottom sheet on a phone, centred dialog on a desk. */
export function Sheet({ title, onClose, children, footer, wide = false }) {
  const id = useId();
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="scrim" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`sheet ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="sheet-head">
          <h2 id={id}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ── Controls ─────────────────────────────────────────────────────────────────

export function Button({ kind = 'primary', icon, children, busy, className = '', ...rest }) {
  return (
    <button className={`btn btn-${kind} ${className}`} disabled={busy || rest.disabled} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      <span>{busy ? 'Working…' : children}</span>
    </button>
  );
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}{hint && <Hint text={hint} />}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, placeholder, ...rest }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
    </select>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}{o.n !== undefined && o.n > 0 && <span className="seg-n">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

export function Check({ checked, onChange, children }) {
  return (
    <label className="check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search' }) {
  return (
    <div className="search">
      <Icon name="search" size={18} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button className="icon-btn sm" onClick={() => onChange('')} aria-label="Clear"><Icon name="close" size={16} /></button>}
    </div>
  );
}

// ── Pills and states ─────────────────────────────────────────────────────────

const STATUS_TONE = {
  OUT: 'danger', CRITICAL: 'danger', LOW: 'warn', OK: 'ok',
  PENDING: 'warn', APPROVED: 'brand', PARTLY_ISSUED: 'brand', ISSUED: 'ok', REJECTED: 'danger', CANCELLED: 'faint',
  DRAFT: 'faint', SUBMITTED: 'warn', PARTLY_RECEIVED: 'brand', RECEIVED: 'ok',
  OPEN: 'brand', EXPIRED: 'danger', SOON: 'warn', UNKNOWN: 'faint', URGENT: 'danger',
};
const STATUS_TEXT = {
  OUT: 'Out', CRITICAL: 'Critical', LOW: 'Low', OK: 'In stock', PARTLY_ISSUED: 'Partly given', ISSUED: 'Given out',
  PARTLY_RECEIVED: 'Partly received', SUBMITTED: 'Waiting approval', SOON: 'Expiring soon', UNKNOWN: 'No date',
};
export const statusText = (s) => STATUS_TEXT[s] || (s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : '');

export function Pill({ status, children, tone }) {
  return <span className={`pill tone-${tone || STATUS_TONE[status] || 'faint'}`}>{children || statusText(status)}</span>;
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="note danger" role="alert">
      <Icon name="alert" size={18} />
      <span className="grow">{error.message || String(error)}</span>
      {onRetry && <button className="btn btn-ghost sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Loading({ what = 'Loading' }) {
  return <div className="loading" aria-busy="true"><span className="spinner" />{what}…</div>;
}

// ── Toasts ───────────────────────────────────────────────────────────────────

export function useToasts() {
  const [items, setItems] = useState([]);
  const push = useCallback((text, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4200);
  }, []);
  const view = (
    <div className="toasts" aria-live="polite">
      {items.map((t) => <div key={t.id} className={`toast tone-${t.tone}`}><Icon name={t.tone === 'ok' ? 'check' : 'alert'} size={18} />{t.text}</div>)}
    </div>
  );
  return { push, view };
}

// ── Tables ───────────────────────────────────────────────────────────────────

/**
 * A table on a desk, a stack of cards on a phone (CSS does the switch — each cell carries its
 * column label). Columns: { key, label, render?, align?, sort? }.
 */
export function Table({ columns, rows, onRow, empty = 'Nothing here.', rowKey = (r, i) => r.id ?? i, initialSort }) {
  const [sort, setSort] = useState(initialSort || null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const val = col?.sort || ((r) => r[sort.key]);
    return [...rows].sort((a, b) => {
      const x = val(a); const y = val(b);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true });
      return sort.dir === 'asc' ? c : -c;
    });
  }, [rows, sort, columns]);
  if (!rows.length) return <Quiet icon="check">{empty}</Quiet>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'r' : ''}>
                {c.sortable === false ? c.label : (
                  <button className="th-btn" onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                    {c.label}{sort?.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={rowKey(r, i)} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? 'clickable' : ''}
              tabIndex={onRow ? 0 : undefined} onKeyDown={onRow ? (e) => { if (e.key === 'Enter') onRow(r); } : undefined}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.label} className={`${c.align === 'right' ? 'r' : ''} ${c.primary ? 'primary' : ''}`}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Picking items ────────────────────────────────────────────────────────────

/**
 * Type a name, a code or scan a barcode. Shows the quantity in `storeId` beside each match, so
 * the person sees "3 left" before choosing, not after the refusal.
 */
export function ItemPicker({ items, storeId, onPick, exclude = [], placeholder = 'Add an item — type a name, code or scan', filter }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef(null);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pool = items.filter((i) => i.active !== false && !exclude.includes(i.id) && (!filter || filter(i)));
    if (!t) return pool.slice(0, 30);
    const exact = pool.filter((i) => i.barcode === q.trim() || i.code.toLowerCase() === t);
    if (exact.length) return exact;
    return pool.filter((i) => `${i.name} ${i.code} ${i.category}`.toLowerCase().includes(t)).slice(0, 30);
  }, [q, items, exclude, filter]);
  useEffect(() => {
    const out = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', out);
    return () => document.removeEventListener('pointerdown', out);
  }, []);
  const choose = (it) => { onPick(it); setQ(''); setOpen(false); setHi(0); };
  const qtyIn = (it) => it.stores?.find((s) => s.storeId === storeId);
  return (
    <div className="picker" ref={box}>
      <div className="search">
        <Icon name="search" size={18} />
        <input
          value={q} placeholder={placeholder} aria-label={placeholder} role="combobox" aria-expanded={open}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, matches.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            if (e.key === 'Enter' && matches[hi]) { e.preventDefault(); choose(matches[hi]); }
            if (e.key === 'Escape') setOpen(false);
          }}
        />
      </div>
      {open && (
        <ul className="picker-list" role="listbox">
          {matches.length ? matches.map((it, i) => {
            const s = qtyIn(it);
            return (
              <li key={it.id} role="option" aria-selected={i === hi}>
                <button className={i === hi ? 'hi' : ''} onPointerDown={(e) => { e.preventDefault(); choose(it); }}>
                  <span className="min0 grow">
                    <span className="pick-name">{it.name}</span>
                    <span className="pick-sub"><code>{it.code}</code> · {it.category}</span>
                  </span>
                  {s && <span className={`pick-qty ${s.status !== 'OK' ? `tone-${s.status === 'LOW' ? 'warn' : 'danger'}` : ''}`}>{fmtQty(s.qty)} {it.uom}</span>}
                </button>
              </li>
            );
          }) : <li className="picker-empty">No item matches “{q}”.</li>}
        </ul>
      )}
    </div>
  );
}

/** A number input that keeps what was typed, so "1." does not jump back to "1". */
export function QtyInput({ value, onChange, min = 0, step = 'any', label = 'Quantity', ...rest }) {
  return (
    <input className="qty" type="number" inputMode="decimal" min={min} step={step} value={value ?? ''} aria-label={label}
      onChange={(e) => onChange(e.target.value)} onWheel={(e) => e.currentTarget.blur()} {...rest} />
  );
}

export function Stepper({ value, onChange, max }) {
  const n = Number(value) || 0;
  return (
    <div className="stepper">
      <button type="button" className="icon-btn" aria-label="One less" onClick={() => onChange(String(Math.max(0, n - 1)))}><Icon name="minus" size={16} /></button>
      <QtyInput value={value} onChange={onChange} max={max} />
      <button type="button" className="icon-btn" aria-label="One more" onClick={() => onChange(String(n + 1))}><Icon name="plus" size={16} /></button>
    </div>
  );
}
