/**
 * The shell: sign in through HiFive ID, choose a unit, then the screens the person's roles allow.
 *
 * Navigation is by hash (#/stock, #/requests/<id>) so a link can be forwarded and still land on
 * the right screen after sign-in.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { captureSignIn, get, hfidLoginUrl, post, put, rememberAddress, token, unitPref } from './api.js';
import { AppFrame, AppLogo as HfAppLogo, SideMenu, SignIn as HfSignIn, TabBar, UnitSwitch } from '@hifive/ui';
import Icon from './icons.jsx';
import { startFollowingAppearance, syncChromeColour } from './appearance.js';
import { AppCtx, Boundary, Button, Loading, Note, Segmented, Sheet, useToasts } from './ui.jsx';
import { chooseLang, has, lang, LANGS, setLang, t, useLang } from './i18n.js';
import FirstTour from './tour.jsx';
import { useNewVersion } from './update.js';
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
import InUse from './screens/InUse.jsx';
import Returns from './screens/Returns.jsx';
import Recall from './screens/Recall.jsx';
import Accounts from './screens/Accounts.jsx';
import Assets from './screens/Assets.jsx';

/** Every screen, who sees it, and where it sits. `any` lists abilities; one is enough. `when`, a unit setting that must be on. */
const SCREENS = [
  { id: 'today', label: 'Today', icon: 'today', group: 'main', any: ['stock.view'], el: Today },
  { id: 'stock', label: 'Stock', icon: 'stock', group: 'main', any: ['stock.view'], el: Stock },
  { id: 'use', label: 'Record use', icon: 'use', group: 'do', any: ['stock.use'], el: UseScreen },
  { id: 'services', label: 'Services', icon: 'sparkle', group: 'do', any: ['stock.use', 'services.edit'], el: Services },
  { id: 'scan', label: 'Scan', icon: 'scan', group: 'do', any: ['stock.view'], el: Scan },
  { id: 'with-me', label: 'With me', icon: 'custody', group: 'do', any: ['stock.use'], el: WithMe },
  { id: 'in-use', label: 'In use', icon: 'lab', group: 'do', any: ['stock.view'], when: 'lots.opened', el: InUse },
  { id: 'linen', label: 'Linen', icon: 'linen', group: 'do', any: ['stock.view'], el: Linen },
  { id: 'requests', label: 'Requests', icon: 'requests', group: 'do', any: ['request.create', 'request.decide', 'request.fulfil', 'reports'], el: Requests },
  { id: 'receive', label: 'Receive', icon: 'receive', group: 'store', any: ['receive'], el: ReceiveScreen },
  { id: 'transfer', label: 'Transfer', icon: 'transfer', group: 'store', any: ['transfer'], el: TransferScreen },
  { id: 'purchasing', label: 'Purchasing', icon: 'purchasing', group: 'store', any: ['po.edit', 'po.decide', 'receive', 'reports'], el: Purchasing },
  { id: 'counts', label: 'Stock counts', icon: 'counts', group: 'store', any: ['count.run', 'count.decide', 'reports'], el: Counts },
  { id: 'corrections', label: 'Corrections', icon: 'corrections', group: 'store', any: ['adjust.raise', 'adjust.decide', 'reports'], el: Corrections },
  { id: 'assets', label: 'Equipment', icon: 'asset', group: 'store', any: ['stock.view'], when: 'assets.on', el: Assets },
  { id: 'returns', label: 'Returns and inspection', icon: 'returns', group: 'store', any: ['inspect', 'return.raise', 'return.decide', 'po.edit'], when: ['quarantine.on', 'returns.on'], el: Returns },
  { id: 'reports', label: 'Reports', icon: 'reports', group: 'manage', any: ['reports'], el: Reports },
  { id: 'recall', label: 'Trace a lot', icon: 'trace', group: 'manage', any: ['reports'], when: 'recall.on', el: Recall },
  { id: 'accounts', label: 'Accounts', icon: 'accounts', group: 'manage', any: ['accounts'], when: 'accounting.on', el: Accounts },
  { id: 'admin', label: 'Admin', icon: 'admin', group: 'manage', any: ['admin', 'items.edit', 'supplier.edit'], el: Admin },
  { id: 'help', label: 'Help', icon: 'help', group: 'manage', any: ['stock.view'], el: Help },
];
const GROUPS = { main: null, do: 'Everyday', store: 'Store', manage: 'Manage' };

/**
 * The phone's bottom bar: the four screens this person's role uses most (approved prototype,
 * 13 Nov 2026; Design Guide D-044). Someone with two roles gets the bar of the higher one. A screen
 * the person may not open is skipped and the next one fills its place; every screen stays one
 * tap away in More.
 */
const BARS = {
  manage: ['today', 'requests', 'stock', 'reports'],
  store: ['today', 'requests', 'receive', 'stock'],
  buy: ['today', 'purchasing', 'stock', 'requests'],
  staff: ['today', 'use', 'with-me', 'requests'],
  view: ['today', 'stock', 'reports', 'requests'],
};
export function barFor(can, visible) {
  const bar = can('request.decide') || can('admin') ? BARS.manage
    : can('receive') && can('request.fulfil') ? BARS.store
      : can('po.edit') ? BARS.buy
        : can('stock.use') ? BARS.staff : BARS.view;
  const ids = [...bar, 'today', 'stock', 'use', 'requests', 'reports'].filter((id, i, a) => a.indexOf(id) === i);
  return ids.map((id) => visible.find((s) => s.id === id)).filter(Boolean).slice(0, 4);
}

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

/**
 * A screen's word on the phone's bottom bar, where a slot is about 70px wide. A language may give
 * a shorter word there under 'tab:<English>' (Malayalam does for Requests); otherwise it is the
 * screen's own name.
 */
function tabWord(label) {
  const word = label === 'Record use' ? 'Use' : label;
  return has(`tab:${word}`) ? t(`tab:${word}`) : t(word);
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
  const language = useLang();
  const [touring, setTouring] = useState(false);

  useEffect(() => {
    const on = () => { setRoute(parseHash()); setMenu(false); window.scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const u = await get('/api/me');
      // The interface language (D-043): Inventory's own copy or the device first, then HiFive ID's choice when it answers.
      setLang(chooseLang({ own: u.lang }));
      get('/api/appearance').then((a) => { if (a?.known && a.prefs?.lang) setLang(a.prefs.lang); }).catch(() => {});
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
      // Rooms in number order, so R2 comes before R10 (Herbal Park's R1 to R12, 13 Nov 2026).
      const byNumber = (a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' });
      setLists({ stores, areas: [...areas].sort(byNumber) });
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

  // Wear what the person chose in HiFive ID, from sign-in on.
  const signedIn = !!me;
  useEffect(() => { syncChromeColour(); return signedIn ? startFollowingAppearance() : undefined; }, [signedIn]);

  // The unit's own word for its services (treatments, tests) is what the menu says.
  // `when` is a setting, or several (any one on is enough); "on" is anything but off.
  const switchedOn = (k) => !!me?.settings?.[k] && me.settings[k] !== 'off';
  const visible = useMemo(() => (me ? SCREENS.filter((s) => s.any.some((a) => me.can.includes(a)) && (!s.when || [].concat(s.when).some(switchedOn)))
    .map((s) => (s.id === 'services' ? { ...s, label: me.settings?.['services.word'] || s.label } : s)) : []), [me]);

  const switchUnit = async (id) => {
    unitPref.set(id);
    setUnitSheet(false);
    setStock(null);
    await loadMe();
    navigate('today');
  };
  const signOut = () => { token.clear(); unitPref.clear(); location.hash = ''; location.reload(); };

  // A newer build is live: say so, and reload only when asked (src/update.js). A hook, so it
  // sits above the early returns.
  const fresh = useNewVersion();
  if (checking) return <div className="hf signin"><Loading what={t('Checking your sign-in')} /></div>;
  if (!me) return <SignIn error={error} />;

  const current = visible.find((s) => s.id === route.screen) || visible[0];
  const Screen = current.el;
  const ctx = {
    me, stock, lists, refreshStock, refreshBadges, toast: toasts.push, route, navigate,
    currency: me.settings?.currency || 'AED', can: (a) => me.can.includes(a), reloadMe: loadMe,
    startTour: () => { setMenu(false); setTouring(true); },
  };
  const chooseLanguage = async (code) => {
    setLang(code);
    try { await put('/api/me/prefs', { lang: code }); } catch { /* the screen has changed; saving tries again next time */ }
  };
  const initials = me.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const roleWords = me.roles.map((r) => t(me.labels.roles[r])).join(', ');
  const phoneTabs = barFor(ctx.can, visible);
  const moreScreens = visible.filter((s) => !phoneTabs.includes(s));
  const pickUnit = me.units.length > 1 ? () => { setMenu(false); setUnitSheet(true); } : undefined;
  const sideGroups = [];
  for (const s of visible) {
    let g = sideGroups[sideGroups.length - 1];
    if (!g || g.key !== s.group) { g = { key: s.group, label: GROUPS[s.group] ? t(GROUPS[s.group]) : undefined, items: [] }; sideGroups.push(g); }
    g.items.push({
      key: s.id, icon: <Icon name={s.icon} />, href: `#/${s.id}`, current: current.id === s.id, attrs: { 'data-tour': `nav-${s.id}` },
      label: <>{t(s.label)}{badges[s.id] ? <span className="inv-badge" aria-label={t('{n} waiting', { n: badges[s.id] })}>{badges[s.id]}</span> : null}</>,
    });
  }

  return (
    <AppCtx.Provider value={ctx}>
      {/* The shared frame (Design Guide 2.2, D-049): the side menu inside the rounded panel from
          1024px, the top bar and the phone bar (D-048) below it. Inventory fills them with its own
          screens, unit switch and menu; the walkthrough finds them by their data-tour marks. */}
      <div className="hf inv-shell">
        <AppFrame
          side={(
            <SideMenu label={t('Main')}
              brand={<><HfAppLogo app="inventory" size={36} /><span className="inv-brand__n">{t('Inventory')}</span></>}
              head={<UnitSwitch name={me.unit.name} onClick={pickUnit} />}
              groups={sideGroups}
              foot={(
                <>
                  <a className="inv-nav" href={HIFIVE_HUB}><Icon name="apps" />{t('All HiFive apps')}</a>
                  <button type="button" data-tour="me" className="inv-me" onClick={() => setMenu(true)} aria-label={t('{name}: your menu', { name: me.name })}>
                    <span className="inv-me__av" aria-hidden="true">{initials}</span>
                    <span className="inv-me__b"><span className="inv-me__n">{me.name}</span><span className="inv-me__r">{roleWords}</span></span>
                    <Icon name="more" size={16} />
                  </button>
                </>
              )}
            />
          )}
          top={(
            <header className="inv-bar">
              <HfAppLogo app="inventory" size={36} />
              <UnitSwitch name={me.unit.name} onClick={pickUnit} compact />
              <button type="button" className="inv-bar__me" onClick={() => setMenu(true)} aria-label={t('{name}: your menu', { name: me.name })}>{initials}</button>
            </header>
          )}
          tabs={(
            <TabBar label={t('Main')}
              items={phoneTabs.map((s) => ({
                key: s.id, label: tabWord(s.label), icon: <Icon name={s.icon} size={22} />, href: `#/${s.id}`,
                current: current.id === s.id, attrs: { 'data-tour': `nav-${s.id}` },
              }))}
              more={{ label: t('More'), icon: <Icon name="more" size={22} />, onClick: () => setMenu(true), current: !phoneTabs.some((tab) => tab.id === current.id), attrs: { 'data-tour': 'more' } }}
            />
          )}
        >
          <div className="inv-main" id="main">
            {fresh && (
              <div className="inv-update" role="status">
                <Note icon="alert">{t('A new version of HiFive Inventory is ready.')}</Note>
                <Button kind="secondary" onClick={() => location.reload()}>{t('Reload')}</Button>
              </div>
            )}
            {/* One screen that fails to draw never blanks the app: the frame, the menu and the way
                back stay (13 Nov 2026). */}
            <Boundary where={`the ${current.id} screen`} className="page" resetKey={`${me.unit.id}-${current.id}-${language}`}
              back={current.id === visible[0].id ? undefined : { label: t('Go to {screen}', { screen: t(visible[0].label) }), go: () => navigate(visible[0].id) }}>
              <Screen key={`${me.unit.id}-${current.id}-${language}`} />
            </Boundary>
          </div>
        </AppFrame>
      </div>

      {menu && (
        <Sheet title={me.name} onClose={() => setMenu(false)}>
          <p className="muted">{t('{code} · {roles} in {unit}', { code: me.code, roles: roleWords, unit: me.unit.name })}</p>
          {/* On a phone, More lists only what is not on the bar, then you (approved prototype). The wide
              screen keeps the full list, as its side menu does. */}
          <nav className="inv-more inv-only-phone" aria-label={t('More screens')}>
            {moreScreens.map((s) => (
              <a key={s.id} href={`#/${s.id}`} className={current.id === s.id ? 'inv-nav is-on' : 'inv-nav'} aria-current={current.id === s.id ? 'page' : undefined} onClick={() => setMenu(false)}>
                <Icon name={s.icon} />{t(s.label)}{badges[s.id] ? <span className="inv-badge" aria-label={t('{n} waiting', { n: badges[s.id] })}>{badges[s.id]}</span> : null}
              </a>
            ))}
          </nav>
          <div className="hf-cap inv-navg inv-only-phone">{t('You')}</div>
          <Segmented label={t('Language')} value={language} onChange={chooseLanguage} options={Object.entries(LANGS).map(([value, label]) => ({ value, label }))} />
          <nav className="inv-menu inv-only-desk" aria-label={t('Every screen')}>
            <NavList screens={visible} current={current.id} badges={badges} />
          </nav>
          <div className="inv-menu">
            {pickUnit && <button type="button" className="inv-nav" onClick={pickUnit}><Icon name="unit" />{t('Switch unit')}</button>}
            <button type="button" className="inv-nav" onClick={ctx.startTour}><Icon name="help" />{t('Show me around again')}</button>
            <a className="inv-nav" href={HIFIVE_HUB}><Icon name="apps" />{t('All HiFive apps')}</a>
            <a className="inv-nav" href={HIFIVE_HUB}><Icon name="edit" />{t('Colours and dark mode, in HiFive ID')}</a>
            <button type="button" className="inv-nav" onClick={signOut}><Icon name="logout" />{t('Sign out')}</button>
          </div>
        </Sheet>
      )}
      {unitSheet && (
        <Sheet title={t('Choose a unit')} onClose={() => setUnitSheet(false)}>
          <div className="inv-menu">
            {me.units.map((u) => (
              <button type="button" key={u.id} className={u.id === me.unit.id ? 'inv-nav is-on' : 'inv-nav'} onClick={() => switchUnit(u.id)} aria-pressed={u.id === me.unit.id}>
                <Icon name="unit" />
                <span className="grow">{u.name}<span className="inv-nav__sub">{u.roles.map((r) => t(me.labels.roles[r])).join(', ')}</span></span>
                {u.id === me.unit.id && <Icon name="check" />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
      <FirstTour me={me} visible={visible} open={touring} setOpen={setTouring} />
      {toasts.view}
    </AppCtx.Provider>
  );
}

/** Where every HiFive app is reached from: the person's own page in HiFive ID. */
const HIFIVE_HUB = import.meta.env.VITE_HFID_HUB || 'https://hifive-id-portal.pages.dev/';

function NavList({ screens, current, badges }) {
  let last = null;
  return screens.map((s) => {
    const head = s.group !== last && GROUPS[s.group] ? <div className="hf-cap inv-navg" key={`g-${s.group}`}>{t(GROUPS[s.group])}</div> : null;
    last = s.group;
    return [
      head,
      <a key={s.id} data-tour={`nav-${s.id}`} href={`#/${s.id}`} className={current === s.id ? 'inv-nav is-on' : 'inv-nav'} aria-current={current === s.id ? 'page' : undefined}>
        <Icon name={s.icon} />{t(s.label)}{badges[s.id] ? <span className="inv-badge" aria-label={t('{n} waiting', { n: badges[s.id] })}>{badges[s.id]}</span> : null}
      </a>,
    ];
  });
}

/**
 * Signing in: the shared screen (C18, D-047). One button: HiFive ID's own page then offers
 * Microsoft or Google. The language chosen here stays on this device until sign-in, when the
 * person's own choice takes over (D-043).
 */
function SignIn({ error }) {
  const language = useLang();
  const [busy, setBusy] = useState(false);
  const go = () => { setBusy(true); rememberAddress(); location.href = hfidLoginUrl(); };
  return (
    <HfSignIn app="inventory" name={t('HiFive Inventory')} short={t('Inventory')} lang={language}
      lede={t('Stock, requests, purchasing and linen for every HiFive unit.')}
      note={t('HR gives access to Inventory.')}
      help={t('Cannot sign in? Ask HR, with your employee code.')}
      error={error} busy={busy} onContinue={go}
      languages={Object.entries(LANGS).map(([value, label]) => ({ value, label, lang: value }))}
      language={language} onLanguage={setLang}
      words={{
        title: t('Sign in to Inventory'), sub: t('With your HiFive ID.'), button: t('Continue with HiFive ID'), busy: t('Opening HiFive ID…'),
        hint: t('Use the Microsoft or Google account linked to your HiFive ID.'), oneTitle: t('One sign-in for every HiFive app'),
        ticks: [t('The same account for every HiFive app you use'), t('Your colours and language follow you from app to app'), t('HR decides which apps you can open')],
        language: t('Language'), about: t('About Inventory'),
      }}
    />
  );
}
