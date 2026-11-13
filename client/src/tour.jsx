/**
 * The first-login walkthrough (Design Guide C15), in the person's language (D-043).
 *
 * On a first sign-in a welcome card asks for the language, English or Malayalam, then the tour
 * walks the screens this person will use, chosen by what their role may do: a therapist sees
 * Today, Record use, With me and Requests; a store keeper also Receive; a manager also the
 * approvals waiting on Today. It ends at the menu, where the language and this tour live.
 *
 * "Don't show this again" is kept on the person (tour_done_at), never the device, so it does not
 * repeat on another phone. Skip and "Not now" keep nothing: it offers itself at the next sign-in.
 * It can be replayed from the menu at any time.
 */

import { useEffect, useMemo, useState } from 'react';
import { FirstLoginTour } from '@hifive/ui';
import { put } from './api.js';
import { lang, LANGS, setLang, t, useLang } from './i18n.js';
import { Button, Segmented, Sheet } from './ui.jsx';

// The bottom bar shows below 1024px (styles.css), so that is a phone here too.
const isPhone = () => window.innerWidth < 1024;

/** Where a screen's link is: its tab on a phone, else the side menu; on a phone without a tab, the More button. */
function navSpot(id) {
  if (!isPhone()) return `.hf-side [data-tour="nav-${id}"]`;
  return document.querySelector(`.hf-tabbar [data-tour="nav-${id}"]`) ? `.hf-tabbar [data-tour="nav-${id}"]` : '.hf-tabbar [data-tour="more"]';
}

/** Staff: they record use and run no store (Today.jsx shows them only what is theirs). */
const personal = (can) => can('stock.use') && !['receive', 'request.fulfil', 'request.decide', 'po.edit', 'reports'].some(can);

/** The steps for this person, in their language. */
export function tourSteps(me, visible) {
  const can = (a) => me.can.includes(a);
  const has = (id) => visible.some((s) => s.id === id);
  const word = me.settings?.['services.word'] || 'Services';
  const steps = [
    { selector: '[data-tour="today"]', title: t('This is Today'), text: personal(can)
      ? t('What is waiting on you, the stock you hold and your requests. It is the first screen you see.')
      : t('What is waiting on you, and what the store is short of. It is the first screen you see.') },
  ];
  if (has('use')) steps.push({ selector: navSpot('use'), title: t('Record what you use'), text: t('Each time you use oil, powder or a cloth, record it here: the room, then the items. It takes a few seconds.') });
  if (has('services') && can('stock.use')) steps.push({ selector: navSpot('services'), title: t(word), text: t('Record a whole treatment in one go: its usual items are filled in, and you change only what was different.') });
  if (has('with-me')) steps.push({ selector: navSpot('with-me'), title: t('Stock you take for later'), text: t('Take items to your room now and record them as used, or bring them back. What you hold shows here until then.') });
  if (has('requests')) steps.push({ selector: navSpot('requests'), title: t('Ask the store'), text: t('Need something that is not on your shelf? Ask here; you see when it is approved and given out.') });
  if (has('receive')) steps.push({ selector: navSpot('receive'), title: t('Deliveries'), text: t('Count what arrived against the delivery note and photograph the note. A manager approves it before it is on the shelf.') });
  if (can('request.decide') || can('po.decide') || can('receipt.decide')) {
    // Nothing waiting today: no card, so the step points at the line under the greeting that says so.
    const spot = document.querySelector('[data-tour="waiting"]') ? '[data-tour="waiting"]' : '[data-tour="today"]';
    steps.push({ selector: spot, title: t('Approvals wait here'), text: t('Requests, orders and deliveries that need your approval are listed first on Today, oldest first.') });
  }
  steps.push({ selector: isPhone() ? '.hf-tabbar [data-tour="more"]' : '.hf-side [data-tour="me"]', title: t('Everything else, and your language'), text: t('The menu has every screen, English or Malayalam, and this walkthrough again whenever you want it.') });
  return steps;
}

export default function FirstTour({ me, visible, open, setOpen }) {
  const language = useLang();
  const [welcome, setWelcome] = useState(false);
  const [asked, setAsked] = useState(false);

  // A first sign-in: the welcome card, once per visit.
  useEffect(() => {
    if (me && !me.tourDoneAt && !asked) {
      const timer = setTimeout(() => { setWelcome(true); setAsked(true); }, 900);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [me, asked]);

  const steps = useMemo(() => (open ? tourSteps(me, visible) : []), [open, me, visible, language]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels = {
    step: t('Step {n} of {of}'), skip: t('Skip'), back: t('Back'), next: t('Next'), finish: t('Finish'),
    doneTitle: t('That is HiFive Inventory'), doneText: t('You have seen the screens you will use. The menu has this walkthrough again, any time.'),
    dontShow: t('I understand, do not show this again'), done: t('Done'),
  };
  const remember = (done) => { if (done) put('/api/me/prefs', { tourDone: true }).catch(() => {}); };
  const pick = (code) => { setLang(code); put('/api/me/prefs', { lang: code }).catch(() => {}); };

  return (
    <>
      {welcome && (
        <Sheet title={t('Welcome to HiFive Inventory')} onClose={() => setWelcome(false)}
          footer={<><Button kind="secondary" onClick={() => setWelcome(false)}>{t('Not now')}</Button><Button icon="check" onClick={() => { setWelcome(false); setOpen(true); }}>{t('Show me around')}</Button></>}>
          <p>{t('A short walk through the screens you will use, about a minute.')}</p>
          <Segmented label={t('Language')} value={lang()} onChange={pick} options={Object.entries(LANGS).map(([value, label]) => ({ value, label }))} />
          <p className="muted">{t('You can change the language later in the menu.')}</p>
        </Sheet>
      )}
      <FirstLoginTour open={open && steps.length > 0} steps={steps} labels={labels} lang={language}
        onSkip={() => setOpen(false)} onDone={(dontShow) => { setOpen(false); remember(dontShow); }} />
    </>
  );
}
