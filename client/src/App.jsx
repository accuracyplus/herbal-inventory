/**
 * The shell: sign in through HiFive ID, choose a unit, then the screens the person's roles allow.
 *
 * Navigation is by hash (#/stock, #/requests/<id>) so a link can be forwarded and still land on
 * the right screen after sign-in.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { captureSignIn, get, hfidLoginUrl, post, rememberAddress, token, unitPref } from './api.js';
import Icon from './icons.jsx';
import { AppCtx, Loading, Sheet, useToasts } from './ui.jsx';
import Today from './screens/Today.jsx';
import Stock from './screens/Stock.jsx';
import { TransferScreen, UseScreen } from './screens/Record.jsx';
import ReceiveScreen from './screens/Receive.jsx';
import WithMe from './screens/WithMe.jsx';
import Scan from './screens/Scan.jsx';
import Services from './screens/Services.jsx';
import Linen from './screens/Linen.jsx';
import Requests from './screens/Requests.jsx';
import Purchasing from './screens/Purchasing.jsx';
import Counts from './screens/Counts.jsx';
import Corrections from './screens/Corrections.jsx';
import Reports from './screens/Reports.jsx';
import Admin from './screens/Admin.jsx';
import Help from './screens/Help.jsx';

/** Every screen, who sees it, and where it sits. `any` lists abilities; one is enough. */
const SCREENS = [
  { id: 'today', label: 'Today', icon: 'today', group: 'main', any: ['stock.view'], el: Today },
  { id: 'stock', label: 'Stock', icon: 'stock', group: 'main', any: ['stock.view'], el: Stock },
  { id: 'use', label: 'Record use', icon: 'use', group: 'do', any: ['stock.use'], el: UseScreen },
  { id: 'services', label: 'Services', icon: 'sparkle', group: 'do', any: ['stock.use', 'services.edit'], el: Services },
  { id: 'scan', label: 'Scan', icon: 'scan', group: 'do', any: ['stock.view'], el: Scan },
  { id: 'with-me', label: 'With me', icon: 'custody', group: 'do', any: ['stock.use'], el: WithMe },
  { id: 'linen', label: 'Linen', icon: 'linen', group: 'do', any: ['stock.view'], el: Linen },
  { id: 'requests', label: 'Requests', icon: 'requests', group: 'do', any: ['request.create', 'request.decide', 'request.fulfil', 'reports'], el: Requests },
  { id: 'receive', label: 'Receive', icon: 'receive', group: 'store', any: ['receive'], el: ReceiveScreen },
  { id: 'transfer', label: 'Transfer', icon: 'transfer', group: 'store', any: ['transfer'], el: TransferScreen },
  { id: 'purchasing', label: 'Purchasing', icon: 'purchasing', group: 'store', any: ['po.edit', 'po.decide', 'receive', 'reports'], el: Purchasing },
  { id: 'counts', label: 'Stock counts', icon: 'counts', group: 'store', any: ['count.run', 'count.decide', 'reports'], el: Counts },
  { id: 'corrections', label: 'Corrections', icon: 'corrections', group: 'store', any: ['adjust.raise', 'adjust.decide', 'reports'], el: Corrections },
  { id: 'reports', label: 'Reports', icon: 'reports', group: 'manage', any: ['reports'], el: Reports },
  { id: 'admin', label: 'Admin', icon: 'admin', group: 'manage', any: ['admin', 'items.edit', 'supplier.edit'], el: Admin },
  { id: 'help', label: 'Help', icon: 'help', group: 'manage', any: ['stock.view'], el: Help },
];
const GROUPS = { main: null, do: 'Everyday', store: 'Store', manage: 'Manage' };

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const [screen, id, sub] = path.split('/');
  return { screen: screen || 'today', id: id || null, sub: sub || null, query: new URLSearchParams(qs || '') };
}

export function navigate(to) {
  const next = `#/${to.replace(/^\/?#?\/?/, '')}`;
  if (location.hash !== next) location.hash = next;
}

export default function App() {
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const [route, setRoute] = useState(parseHash);
  const [stock, setStock] = useState(null);
  const [lists, setLists] = useState({ stores: [], areas: [] });
  const [unitSheet, setUnitSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const [badges, setBadges] = useState({});
  const toasts = useToasts();

  useEffect(() => {
    const on = () => { setRoute(parseHash()); setMenu(false); window.scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const u = await get('/api/me');
      setMe(u);
      if (u.unit?.id) unitPref.set(u.unit.id);
      setError(null);
      return u;
    } catch (e) {
      // A saved unit the person no longer holds: forget it and ask again as themselves.
      if (e.status === 403 && unitPref.get()) { unitPref.clear(); return loadMe(); }
      if (e.status === 401) token.clear();
      setError(e.status === 403 || e.code === 'NETWORK' ? e.message : null);
      setMe(null);
      return null;
    }
  }, []);

  useEffect(() => { (async () => {
    let arrived = null;
    try { arrived = await captureSignIn(); } catch (e) { setError(e.message); setChecking(false); return; }
    if (arrived) post('/auth/hfid/arrived').catch(() => {});
    // A phone opening a computer's pairing link works in the unit the computer is in.
    const askedUnit = parseHash().query.get('unit');
    if (askedUnit) unitPref.set(askedUnit);
    if (!token.get()) { setChecking(false); return; }
    await loadMe();
    setChecking(false);
  })(); }, [loadMe]);

  const refreshStock = useCallback(async () => {
    try {
      const [s, stores, areas] = await Promise.all([get('/api/stock'), get('/api/stores'), get('/api/areas')]);
      setStock(s);
      setLists({ stores, areas });
    } catch (e) { toasts.push(e.message, 'danger'); }
  }, [toasts.push]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshBadges = useCallback(async () => {
    try {
      const t = await get('/api/today');
      const b = {};
      for (const w of t.waiting) b[w.screen] = (b[w.screen] || 0) + w.n;
      setBadges(b);
    } catch { /* badges are a convenience */ }
  }, []);

  useEffect(() => { if (me) { refreshStock(); refreshBadges(); } }, [me, refreshStock, refreshBadges]);

  // The unit's own word for its services (treatments, tests) is what the menu says.
  const visible = useMemo(() => (me ? SCREENS.filter((s) => s.any.some((a) => me.can.includes(a)))
    .map((s) => (s.id === 'services' ? { ...s, label: me.settings?.['services.word'] || s.label } : s)) : []), [me]);

  const switchUnit = async (id) => {
    unitPref.set(id);
    setUnitSheet(false);
    setStock(null);
    await loadMe();
    navigate('today');
  };
  const signOut = () => { token.clear(); unitPref.clear(); location.hash = ''; location.reload(); };

  if (checking) return <div className="signin"><Loading what="Checking your sign-in" /></div>;
  if (!me) return <SignIn error={error} />;

  const current = visible.find((s) => s.id === route.screen) || visible[0];
  const Screen = current.el;
  const ctx = {
    me, stock, lists, refreshStock, refreshBadges, toast: toasts.push, route, navigate,
    currency: me.settings?.currency || 'AED', can: (a) => me.can.includes(a), reloadMe: loadMe,
  };
  const initials = me.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const phoneNav = ['today', 'stock', me.can.includes('stock.use') ? 'use' : 'requests', 'requests'].filter((v, i, a) => a.indexOf(v) === i);
  const phoneTabs = [...phoneNav.map((id) => visible.find((s) => s.id === id)).filter(Boolean)].slice(0, 4);

  return (
    <AppCtx.Provider value={ctx}>
      <div className="shell">
        <aside className="side" aria-label="Main">
          <div className="brand">
            <span className="brand-mark">H5</span>
            <span className="min0"><span className="brand-name">Inventory</span><span className="brand-sub">{me.unit.name}</span></span>
          </div>
          <NavList screens={visible} current={current.id} badges={badges} />
          <div className="side-foot">
            {me.units.length > 1 && <button className="nav-item" onClick={() => setUnitSheet(true)}><Icon name="unit" />Switch unit</button>}
            <button className="nav-item" onClick={signOut}><Icon name="logout" />Sign out</button>
          </div>
        </aside>
        <div className="min0">
          <header className="topbar">
            <span className="brand-mobile"><span className="brand-mark" style={{ width: 32, height: 32, fontSize: 13 }}>H5</span></span>
            <button className="unit-switch" onClick={() => me.units.length > 1 && setUnitSheet(true)} aria-label={`Unit: ${me.unit.name}${me.units.length > 1 ? '. Switch unit' : ''}`}>
              <Icon name="unit" size={16} /><span>{me.unit.name}</span>{me.units.length > 1 && <Icon name="chevron" size={14} />}
            </button>
            <span className="grow" />
            <button className="avatar" onClick={() => setMenu(true)} aria-label={`${me.name} — menu`} title={me.name}>{initials}</button>
          </header>
          <main className="main" id="main">
            <Screen key={`${me.unit.id}-${current.id}`} />
          </main>
        </div>
        <nav className="bottom-nav" aria-label="Main">
          {phoneTabs.map((s) => (
            <button key={s.id} className={current.id === s.id ? 'on' : ''} onClick={() => navigate(s.id)}>
              <Icon name={s.icon} size={22} /><span>{s.label === 'Record use' ? 'Use' : s.label}</span>
              {badges[s.id] ? <span className="dot" aria-label={`${badges[s.id]} waiting`} /> : null}
            </button>
          ))}
          <button className={phoneTabs.some((t) => t.id === current.id) ? '' : 'on'} onClick={() => setMenu(true)}>
            <Icon name="more" size={22} /><span>More</span>
          </button>
        </nav>
      </div>
      {menu && (
        <Sheet title={me.name} onClose={() => setMenu(false)}>
          <p className="muted">{me.code} · {me.roles.map((r) => me.labels.roles[r]).join(', ')} in {me.unit.name}</p>
          <NavList screens={visible} current={current.id} badges={badges} />
          {me.units.length > 1 && <button className="nav-item" onClick={() => { setMenu(false); setUnitSheet(true); }}><Icon name="unit" />Switch unit</button>}
          <button className="nav-item" onClick={signOut}><Icon name="logout" />Sign out</button>
        </Sheet>
      )}
      {unitSheet && (
        <Sheet title="Choose a unit" onClose={() => setUnitSheet(false)}>
          <div className="stack">
            {me.units.map((u) => (
              <button key={u.id} className={`nav-item ${u.id === me.unit.id ? 'on' : ''}`} onClick={() => switchUnit(u.id)}>
                <Icon name="unit" />
                <span className="grow">{u.name}<span className="row-sub">{u.roles.map((r) => me.labels.roles[r]).join(', ')}</span></span>
                {u.id === me.unit.id && <Icon name="check" />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {toasts.view}
    </AppCtx.Provider>
  );
}

function NavList({ screens, current, badges }) {
  let last = null;
  return screens.map((s) => {
    const head = s.group !== last && GROUPS[s.group] ? <div className="nav-group" key={`g-${s.group}`}>{GROUPS[s.group]}</div> : null;
    last = s.group;
    return [
      head,
      <button key={s.id} className={`nav-item ${current === s.id ? 'on' : ''}`} onClick={() => navigate(s.id)} aria-current={current === s.id ? 'page' : undefined}>
        <Icon name={s.icon} />{s.label}{badges[s.id] ? <span className="badge">{badges[s.id]}</span> : null}
      </button>,
    ];
  });
}

function SignIn({ error }) {
  const go = (provider) => { rememberAddress(); location.href = hfidLoginUrl(provider); };
  return (
    <div className="signin">
      <div className="card signin-card">
        <span className="brand-mark">H5</span>
        <div className="stack" style={{ gap: 6 }}>
          <h1>HiFive Inventory</h1>
          <p className="muted">Stock, requests, purchasing and linen for every HiFive unit.</p>
        </div>
        {error && <div className="note danger" role="alert"><Icon name="alert" size={18} /><span>{error}</span></div>}
        <div className="stack" style={{ gap: 10 }}>
          <button className="btn btn-primary block" onClick={() => go('microsoft')}>Sign in with Microsoft (apml.co)</button>
          <button className="btn btn-secondary block" onClick={() => go('google')}>Sign in with Google</button>
        </div>
        <p className="faint" style={{ fontSize: 12 }}>You sign in once through HiFive ID — the same account as Recruitment, Performance and the rest of the suite.</p>
      </div>
    </div>
  );
}
