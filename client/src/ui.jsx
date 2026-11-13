/**
 * The pieces every screen is built from. Each one is drawn by the HiFive library (@hifive/ui);
 * this file only fits the library's components to the way Inventory's screens ask for them
 * (an icon by name, a status by its code), so a change to the library reaches every screen.
 *
 * Nothing here has a look of its own. A piece the library lacks is asked for in hifive-design
 * (Design Guide Part J), never drawn here.
 */

import { Children, cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search as SearchGlass, X } from 'lucide-react';
import {
  Banner, Button as HfButton, Checkbox, Chip, ChipGroup, DataTable, Hint as HfHint, ListRow, Loading as HfLoading,
  Picker, QuantityField, Quiet as HfQuiet, Sheet as HfSheet, StatusChip, Tile as HfTile, Toast,
} from '@hifive/ui';
import Icon from './icons.jsx';
import { fmtQty, get } from './api.js';
import { has, t, useLang } from './i18n.js';

/**
 * One English word can mean different things in different places ("Open" is a button, a filter
 * and a status). A language may give the word for one place under '<place>:<English>'; without
 * one, the plain word is used.
 */
const inPlace = (place, v) => (typeof v === 'string' && has(`${place}:${v}`) ? t(`${place}:${v}`) : tx(v));

/**
 * Plain English given to a piece is said in the screen's language (D-043). Only exact phrases in
 * the word list change; anything else (an item's name, a store, a person) is data and stays.
 */
export const tx = (v) => (typeof v === 'string' ? t(v) : v);

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

export function Page({ title, subtitle, actions, children, back, tour }) {
  useLang();
  return (
    <div className="page">
      {back && <button type="button" className="hf-btn hf-btn--quiet inv-back" onClick={back}><Icon name="back" size={18} />{t('Back')}</button>}
      <header className="page-head" data-tour={tour}>
        <div className="min0">
          <h1 className="inv-h1">{tx(title)}</h1>
          {subtitle && <p className="inv-lede">{tx(subtitle)}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

/** A card that holds a form or facts has a heading; one that holds a list or a table has a caption. */
export function Card({ title, hint, actions, children, className = '', pad = true, tour }) {
  return (
    <section className={`hf-card inv-card ${pad ? '' : 'nopad'} ${className}`} data-tour={tour}>
      {(title || actions) && (
        <div className="inv-card__h">
          <h2 className={pad ? 'inv-h2' : 'hf-cap inv-cap'}>{tx(title)}{hint && <Hint text={hint} />}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const TILE_TONE = { brand: 'brand', accent: 'pop', danger: 'danger', warn: 'warn', ok: 'ok' };

/** C4 · Tile: one live number with its label. A tile is never shown for zero: the screen leaves it out. */
export function Tile({ icon, value, label, tone = 'brand', onClick, hint }) {
  return <HfTile tone={TILE_TONE[tone] || 'brand'} icon={<Icon name={icon} size={18} />} value={value} label={tx(label)} hint={tx(hint)} onClick={onClick} />;
}

/** Rows in a card: icon, what it is, a line under it, and where it goes. A flag is said as a status chip. */
export function StatusRows({ rows }) {
  return (
    <div className="hf-listcard__rows inv-rows">
      {rows.map((r) => (
        <ListRow key={r.key} icon={r.icon ? <Icon name={r.icon} size={20} /> : undefined} title={tx(r.label)} sub={tx(r.sub)} onClick={r.onClick}
          trailing={r.flag ? <StatusChip tone={r.tone === 'warn' ? 'warn' : 'danger'}>{tx(r.flag)}</StatusChip> : r.end} />
      ))}
    </div>
  );
}

/** An empty section collapses to one line, never an empty box. */
export function Quiet({ children, icon = 'check' }) {
  return <HfQuiet icon={<Icon name={icon} size={16} />}>{tx(children)}</HfQuiet>;
}

/** C8 · Hint: a "?" that opens one to three sentences. */
export function Hint({ text }) {
  return <HfHint text={tx(text)} />;
}

/** C9 · Sheet: bottom sheet on a phone, centred dialog on a desk. The footer stays in view. */
export function Sheet({ title, onClose, children, footer, wide = false }) {
  return (
    <HfSheet open title={tx(title)} onClose={onClose} wide={wide}>
      <div className="inv-sheet__body">{children}</div>
      {footer && <div className="inv-sheet__foot">{footer}</div>}
    </HfSheet>
  );
}

/** A note inside a screen: something to know (plain), to look at (warn), or that stopped it (danger). */
export function Note({ tone = 'plain', icon, children, role }) {
  return <Banner tone={tone} role={role} icon={icon ? <Icon name={icon} size={18} /> : undefined}>{tx(children)}</Banner>;
}

// ── Controls ─────────────────────────────────────────────────────────────────

// The Design Guide has three buttons. What used to be a red button is a secondary one: the
// words say what it does, and anything that cannot be undone asks first.
const VARIANT = { primary: 'primary', secondary: 'secondary', ghost: 'quiet', danger: 'secondary' };

export function Button({ kind = 'primary', icon, children, busy, className = '', disabled, ...rest }) {
  const block = /\bblock\b/.test(className);
  return (
    <HfButton variant={VARIANT[kind] || 'secondary'} fit={!block} icon={icon ? <Icon name={icon} size={18} /> : undefined}
      busy={busy} disabled={busy || disabled} {...rest}>{tx(children)}</HfButton>
  );
}

const TAKES_A_LABEL = ['input', 'select', 'textarea'];
const PLAIN_INPUT = (el) => el.type === 'textarea' || el.type === 'select' || !['checkbox', 'radio', 'file', 'range'].includes(el.props.type);

/**
 * A label over one control. A plain input, select or text box inside it takes the library's
 * field look; the label is tied to it by id, so pressing the label puts the cursor in the box.
 */
export function Field({ label, hint, error, children, className = '' }) {
  const auto = useId();
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const host = only && typeof only.type === 'string' && TAKES_A_LABEL.includes(only.type);
  const ours = only && [Select, QtyInput, Stepper, SearchBox].includes(only.type);
  label = tx(label); hint = tx(hint); error = tx(error);
  const top = (htmlFor) => (
    <span className="inv-fld__top">
      {htmlFor ? <label htmlFor={htmlFor} className="hf-fld__l">{label}</label> : <span className="hf-fld__l">{label}</span>}
      {hint && <Hint text={hint} />}
    </span>
  );
  if (host || ours) {
    const id = only.props.id || auto;
    const cls = host && PLAIN_INPUT(only)
      ? ['hf-input', only.type === 'textarea' ? 'hf-input--area' : '', error ? 'hf-input--err' : '', only.props.className || ''].filter(Boolean).join(' ')
      : only.props.className;
    return (
      <div className={`hf-fld ${className}`}>
        {top(id)}
        {cloneElement(only, { id, className: cls })}
        {error && <span className="hf-fld__e">{error}</span>}
      </div>
    );
  }
  // Something of its own inside (a picker, a row of buttons): one group with a visible name.
  return (
    <div className={`hf-fld ${className}`} role="group" aria-label={typeof label === 'string' ? label : undefined}>
      {top(null)}
      {children}
      {error && <span className="hf-fld__e">{error}</span>}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder, className = '', ...rest }) {
  return (
    <span className={`hf-select ${className}`}>
      <select className="hf-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
        {placeholder !== undefined && <option value="">{tx(placeholder)}</option>}
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{tx(o.label)}</option>)}
      </select>
      <ChevronDown size={18} aria-hidden="true" />
    </span>
  );
}

/** The sections of a screen, or a Show filter: chips, with a count where something is waiting. */
export function Segmented({ value, onChange, options, label }) {
  return (
    <ChipGroup label={tx(label)}>
      {options.map((o) => (
        <Chip key={o.value} pressed={value === o.value} count={o.n > 0 ? o.n : undefined} onClick={() => onChange(o.value)}>{inPlace('filter', o.label)}</Chip>
      ))}
    </ChipGroup>
  );
}

export function Check({ checked, onChange, children, ...rest }) {
  return <Checkbox label={tx(children)} checked={!!checked} onChange={(e) => onChange(e.target.checked)} {...rest} />;
}

export function SearchBox({ value, onChange, placeholder = 'Search', id }) {
  placeholder = tx(placeholder);
  return (
    <div className="hf-search inv-search" role="search">
      <SearchGlass size={18} aria-hidden="true" />
      <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button type="button" className="hf-search__clear" onClick={() => onChange('')} aria-label={t('Clear the search')}><X size={16} aria-hidden="true" /></button>}
    </div>
  );
}

// ── Status ───────────────────────────────────────────────────────────────────

const STATUS_TONE = {
  OUT: 'danger', CRITICAL: 'danger', LOW: 'warn', OK: 'ok',
  PENDING: 'warn', APPROVED: 'plain', PARTLY_ISSUED: 'plain', ISSUED: 'ok', REJECTED: 'danger', CANCELLED: 'plain',
  DRAFT: 'plain', SUBMITTED: 'warn', PARTLY_RECEIVED: 'plain', RECEIVED: 'ok',
  OPEN: 'plain', EXPIRED: 'danger', SOON: 'warn', UNKNOWN: 'plain', URGENT: 'danger',
};
const STATUS_TEXT = {
  OUT: 'Out', CRITICAL: 'Nearly out', LOW: 'Low', OK: 'In stock', PARTLY_ISSUED: 'Partly given', ISSUED: 'Given out',
  PARTLY_RECEIVED: 'Partly received', SUBMITTED: 'Waiting approval', SOON: 'Expiring soon', UNKNOWN: 'No date',
};
const CHIP_TONE = { ok: 'ok', warn: 'warn', danger: 'danger', brand: 'plain', faint: 'plain', plain: 'plain' };
export const statusText = (s) => inPlace('status', STATUS_TEXT[s] || (s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : ''));

/** A status, always an icon and words: the fixed status colours only, never the palette's. */
export function Pill({ status, children, tone }) {
  return <StatusChip tone={CHIP_TONE[tone] || STATUS_TONE[status] || 'plain'}>{tx(children) || statusText(status)}</StatusChip>;
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <Banner tone="danger" role="alert" action={onRetry ? { label: t('Try again'), onClick: onRetry } : undefined}>
      {tx(error.message || String(error))}
    </Banner>
  );
}

export function Loading({ what = 'Loading' }) {
  return <HfLoading label={tx(what)} />;
}

// ── Toasts ───────────────────────────────────────────────────────────────────

/** One short line at the foot of the screen, one at a time, in the order they were said. */
export function useToasts() {
  const [queue, setQueue] = useState([]);
  const push = useCallback((text) => setQueue((q) => { const said = tx(String(text)); return q[q.length - 1] === said ? q : [...q, said]; }), []);
  const done = useCallback(() => setQueue((q) => q.slice(1)), []);
  const view = <Toast text={queue[0] ?? null} onDone={done} ms={4200} />;
  return { push, view };
}

// ── Tables ───────────────────────────────────────────────────────────────────

/**
 * A table on a desk, a card for each row on a phone. Columns: { key, label, render?, align?,
 * sort?, sortable?, primary?, width? }. A table of more than five columns stays as cards until
 * the screen is wide enough to read it.
 */
export function Table({ columns, rows, onRow, empty = 'Nothing here.', rowKey = (r, i) => r.id ?? i, initialSort, caption = 'List' }) {
  const index = useMemo(() => new Map(rows.map((r, i) => [r, i])), [rows]);
  const cols = columns.map((c) => ({
    key: c.key, label: inPlace('col', c.label), render: c.render, lead: !!c.primary, align: c.align === 'right' ? 'end' : 'start',
    width: c.width || (c.primary ? 'minmax(0, 1.6fr)' : undefined),
    sortValue: c.sortable === false ? undefined : (c.sort || ((r) => r[c.key])),
  }));
  if (!rows.length) return <Quiet icon="check">{empty}</Quiet>;
  return (
    <DataTable caption={tx(caption)} hideCaption columns={cols} rows={rows} rowKey={(r) => String(rowKey(r, index.get(r)))}
      onRowClick={onRow} initialSort={initialSort || null} wide={columns.length > 5} />
  );
}

// ── Picking items, and how many ──────────────────────────────────────────────

/**
 * Type a name, a code or scan a barcode. Shows the quantity in `storeId` beside each match, so
 * the person sees "3 left" before choosing, not after the refusal.
 */
export function ItemPicker({ items, storeId, onPick, exclude = [], placeholder = 'Add an item: type a name or a code, or scan', filter, label = 'Item', showLabel = false }) {
  const options = useMemo(() => items
    .filter((i) => i.active !== false && !exclude.includes(i.id) && (!filter || filter(i)))
    .map((it) => {
      const s = it.stores?.find((x) => x.storeId === storeId);
      return {
        value: it.id, label: it.name, sub: `${it.code} · ${it.category}`, keywords: it.category,
        codes: [it.code, it.barcode, ...(it.barcodes || [])].filter(Boolean),
        end: s ? `${fmtQty(s.qty)} ${it.uom}` : undefined,
        endTone: s && s.status !== 'OK' ? (s.status === 'LOW' ? 'warn' : 'danger') : undefined,
        item: it,
      };
    }), [items, storeId, exclude, filter]);
  return (
    <Picker label={tx(label)} hideLabel={!showLabel} placeholder={tx(placeholder)} options={options} onPick={(o) => onPick(o.item)}
      empty={(typed) => t('No item matches “{typed}”.', { typed })} />
  );
}

/** A number box that keeps what was typed, so "1." does not jump back to "1". For a table of counts. */
export function QtyInput({ value, onChange, min = 0, step = 'any', label = 'Quantity', className = '', ...rest }) {
  return (
    <input className={`hf-input inv-num ${className}`} type="number" inputMode="decimal" min={min} step={step} value={value ?? ''} aria-label={tx(label)}
      onChange={(e) => onChange(e.target.value)} onWheel={(e) => e.currentTarget.blur()} {...rest} />
  );
}

/** A quantity with one step down or up, and what it is counted in. */
export function Stepper({ value, onChange, max, min = 0, unit, label = 'Quantity', id }) {
  return <QuantityField id={id} label={tx(label)} hideLabel value={value} onChange={onChange} min={min} max={max} unit={unit} />;
}
