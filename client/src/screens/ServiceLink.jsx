/**
 * Services arriving from a booking or billing system: what is waiting because it could not be
 * recorded, a sheet to upload until something is connected, and (for administrators) the keys
 * another system uses to send them.
 */

import { useState } from 'react';
import { API, fmtDateTime, post } from '../api.js';
import { t } from '../i18n.js';
import Icon from '../icons.jsx';
import { Button, Card, ErrorNote, Field, Loading, Note, Pill, Quiet, Select, useApp, useData } from '../ui.jsx';

const RESULT = { ready: ['ok', 'Ready'], recorded: ['ok', 'Recorded'], duplicate: ['faint', 'Already recorded'], dismissed: ['faint', 'Dismissed'], problem: ['danger', 'Problem'], failed: ['danger', 'Waiting'], refused: ['danger', 'Refused'] };

function saveFile(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export default function ServiceLink({ word }) {
  const { can } = useApp();
  // A sheet can leave rows waiting; the list above it is asked again when one has been recorded.
  const [round, setRound] = useState(0);
  return (
    <div className="stack">
      <Waiting key={round} />
      <Sheet word={word} onRecorded={() => setRound((n) => n + 1)} />
      {can('admin') && <Keys />}
    </div>
  );
}

function Waiting() {
  const { toast, refreshStock, refreshBadges } = useApp();
  const { data, error, loading, reload } = useData('/api/link/inbox');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [note, setNote] = useState({});
  const after = () => { reload(); refreshStock(); refreshBadges(); };
  const retry = async (id) => {
    setBusy(true); setErr(null);
    try { const r = await post(id ? `/api/link/inbox/${id}/retry` : '/api/link/inbox/retry'); toast(t('{recorded} recorded, {failed} still waiting', { recorded: r.recorded, failed: r.failed }), r.failed ? 'danger' : 'ok'); after(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const dismiss = async (id) => {
    setBusy(true); setErr(null);
    try { await post(`/api/link/inbox/${id}/dismiss`, { note: note[id] || '' }); toast('Dismissed'); after(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  return (
    <Card title="Waiting" hint="Services that arrived but could not be recorded. Fix what the reason says (add the service or room, receive the stock), then try again. Dismiss one that should never be recorded, such as a test."
      actions={data?.length > 1 && <Button kind="secondary" busy={busy} onClick={() => retry(null)}>Try all again</Button>}>
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && !data.length && <Quiet>Nothing is waiting. Everything that arrived has been recorded.</Quiet>}
      {data?.length > 0 && (
        <ul className="lots">
          {data.map((w) => (
            <li key={w.id} className="lot">
              <div className="min0">
                <span className="row-label">{w.ext_ref} · {w.payload.times || 1} × {w.payload.service || t('no service named')}</span>
                <span className="row-sub tone-txt-CRITICAL">{w.error}</span>
                <span className="row-sub">{[w.source, w.payload.room, w.payload.person, t('arrived {when}', { when: fmtDateTime(w.received_at) })].filter(Boolean).join(' · ')}</span>
                <input value={note[w.id] || ''} onChange={(e) => setNote({ ...note, [w.id]: e.target.value })} placeholder={t('Reason, if dismissing')} aria-label={t('Reason for dismissing {ref}', { ref: w.ext_ref })} maxLength={300} />
              </div>
              <div className="lot-actions">
                <Button kind="ghost" busy={busy} onClick={() => dismiss(w.id)}>Dismiss</Button>
                <Button kind="secondary" busy={busy} onClick={() => retry(w.id)}>Try again</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ErrorNote error={err} />
    </Card>
  );
}

function Sheet({ word, onRecorded }) {
  const { lists, toast, refreshStock, refreshBadges } = useApp();
  const subs = [...lists.stores.filter((s) => s.kind === 'SUB'), ...lists.stores.filter((s) => s.kind !== 'SUB')];
  const tpl = useData('/api/link/sheet');
  // The store list can arrive after this screen opens; what the box shows must be what is sent.
  const [chosen, setStoreId] = useState('');
  const storeId = chosen || subs[0]?.id || '';
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [pick, setPick] = useState(0);
  const clear = () => { setFile(null); setReport(null); setErr(null); setPick((n) => n + 1); };
  const download = async () => {
    try {
      const { writeXlsx } = await import('../sheet.js');
      const tp = tpl.data;
      saveFile(new Blob([writeXlsx({ sheet: tp.sheet, columns: tp.columns, rows: tp.rows })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${tp.fileName}.xlsx`);
    } catch (e) { setErr(e); }
  };
  const send = async (table, dryRun) => {
    setBusy(true); setErr(null);
    try {
      const r = await post('/api/link/sheet', { ...table, storeId, dryRun });
      setReport(r);
      if (!dryRun) { toast(r.failed ? t('{recorded} recorded, {failed} waiting', { recorded: r.recorded, failed: r.failed }) : t('{recorded} recorded', { recorded: r.recorded }), r.failed ? 'danger' : 'ok'); refreshStock(); refreshBadges(); onRecorded?.(); }
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const choose = async (f) => {
    setErr(null); setReport(null); setFile(null);
    try {
      const { readTable } = await import('../sheet.js');
      const table = readTable(new Uint8Array(await f.arrayBuffer()));
      setFile({ name: f.name, table });
      await send(table, true);
    } catch (e) { setErr(e); }
  };
  const shown = report ? report.results.filter((r) => !['ready', 'recorded'].includes(r.status)) : [];
  return (
    <Card title="From a sheet" hint={t('Until a booking or billing system is connected, a list of {word} done can be uploaded. Each row needs its own reference, so a row sent twice is recorded once.', { word: t(word.toLowerCase()) })}>
      <div className="stack">
        {tpl.data && (
          <>
            <div className="scan-row"><Button kind="secondary" icon="download" onClick={download}>Excel sheet to fill in</Button></div>
            <ul className="lots">{tpl.data.columns.map((c) => <li key={c.header} className="lot"><div className="min0"><span className="row-label">{c.header}{c.required ? '' : ` (${t('optional')})`}</span><span className="row-sub">{c.hint}</span></div></li>)}</ul>
          </>
        )}
        <div className="form two">
          <Field label="Take stock from" hint="For rows that name no store."><Select value={storeId} onChange={(v) => { setStoreId(v); clear(); }} options={subs.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="The filled-in file"><input key={pick} type="file" accept=".xlsx,.csv,.txt,text/csv" onChange={(e) => e.target.files[0] && choose(e.target.files[0])} /></Field>
        </div>
        {busy && !report && <Loading what="Checking the file" />}
        <ErrorNote error={err} />
        {report && (
          <>
            <dl className="hf-kv hf-kv--3">
              <div><dt>{t(report.dryRun ? 'Ready' : 'Recorded')}</dt><dd>{report.dryRun ? report.ready : report.recorded}</dd></div>
              <div><dt>{t('Already recorded')}</dt><dd>{report.duplicates}</dd></div>
              <div><dt>{t(report.dryRun ? 'Problems' : 'Waiting')}</dt><dd className={(report.dryRun ? report.problems : report.failed) ? 'tone-txt-CRITICAL' : ''}>{report.dryRun ? report.problems : report.failed}</dd></div>
            </dl>
            {report.short?.length > 0 && <Note tone="warn" icon="alert"><div><b>{t('Not enough on the shelf for all of these')}</b><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{report.short.map((s) => <li key={s}>{s}</li>)}</ul>{t('The rows that fit are recorded; the rest wait above until stock is received.')}</div></Note>}
            {shown.length > 0 && (
              <ul className="lots">
                {shown.slice(0, 100).map((r) => (
                  <li key={r.row} className="lot"><div className="min0">
                    <span className="row-label">{t('Row {n}', { n: r.row })} · {r.ref || t('no reference')} <Pill tone={RESULT[r.status][0]}>{RESULT[r.status][1]}</Pill></span>
                    {r.error && <span className="row-sub tone-txt-CRITICAL">{r.error}</span>}
                  </div></li>
                ))}
              </ul>
            )}
            {!report.dryRun && <Quiet>{report.failed ? 'Done. What could not be recorded is under Waiting, with the reason.' : 'Done. Every row is recorded.'}</Quiet>}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button kind="secondary" onClick={clear}>Choose another file</Button>
              {report.dryRun && <Button busy={busy} icon="check" onClick={() => send(file.table, false)}>{report.ready ? t('Record {n}', { n: report.ready }) : 'Record'}</Button>}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function Keys() {
  const { lists, toast } = useApp();
  const { data, error, loading, reload } = useData('/api/link/keys');
  const [name, setName] = useState('');
  const [chosen, setStoreId] = useState('');
  const storeId = chosen || lists.stores.find((s) => s.kind === 'SUB')?.id || lists.stores[0]?.id || '';
  const [made, setMade] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const url = `${API || location.origin}/hooks/services`;
  const create = async () => {
    setBusy(true); setErr(null);
    try { setMade(await post('/api/link/keys', { name, storeId })); setName(''); reload(); } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const revoke = async (k) => { setErr(null); try { await post(`/api/link/keys/${k.id}/revoke`); toast(t('{name} can no longer send', { name: k.name })); reload(); } catch (e) { setErr(e); } };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast('Copied'); } catch { toast('Select the text and copy it', 'danger'); } };
  const example = `POST ${url}\nAuthorization: Bearer <the key>\nContent-Type: application/json\n\n{ "services": [\n  { "ref": "INV-1001-1", "service": "ABH", "times": 1,\n    "at": "2026-11-10T14:30:00+04:00",\n    "room": "R1", "person": "HPAHC040", "price": 250 }\n] }`;
  return (
    <Card title="Connections" hint="A key lets one other system send completed services for this unit, and nothing else. It is shown once, when it is made: keep it in that system's settings. A lost key is replaced, not recovered.">
      <div className="stack">
        <ErrorNote error={error} onRetry={reload} />
        {loading && !data && <Loading />}
        {data && !data.length && <Quiet icon="help">Nothing is connected yet.</Quiet>}
        {data?.length > 0 && (
          <ul className="lots">
            {data.map((k) => (
              <li key={k.id} className="lot">
                <div className="min0"><span className="row-label">{k.name} {k.revoked_at ? <Pill tone="faint">Revoked</Pill> : <Pill tone="ok">Live</Pill>}</span>
                  <span className="row-sub"><code>{k.hint}…</code> · {t('takes from {store}', { store: k.store_name })} · {t('made by {name}, {when}', { name: k.created_by, when: fmtDateTime(k.created_at) })} · {k.last_used_at ? t('last used {when}', { when: fmtDateTime(k.last_used_at) }) : t('never used')}</span></div>
                {!k.revoked_at && <div className="lot-actions"><Button kind="ghost" onClick={() => revoke(k)}>Revoke</Button></div>}
              </li>
            ))}
          </ul>
        )}
        {made && (
          <Note tone="warn" icon="alert"><div className="min0 stack" style={{ gap: 8 }}>
            <b>{t('The key for {name}. It will not be shown again.', { name: made.name })}</b>
            <code style={{ overflowWrap: 'anywhere' }}>{made.key}</code>
            <div className="row"><Button kind="secondary" onClick={() => copy(made.key)}>Copy the key</Button><Button kind="ghost" onClick={() => setMade(null)}>I have stored it</Button></div>
          </div></Note>
        )}
        <div className="form two">
          <Field label="New connection" hint="The name of the system it is for."><input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Front desk billing')} maxLength={60} /></Field>
          <Field label="Takes stock from"><Select value={storeId} onChange={setStoreId} options={lists.stores.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><Button busy={busy} icon="plus" onClick={create}>Make a key</Button></div>
        <ErrorNote error={err} />
        <details>
          <summary>{t('What the other system sends')}</summary>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}><code>{example}</code></pre>
          <p className="muted">{t('Only {ref} and {service} are always needed; the room and the person follow this unit\'s rule for recording use. The answer says what became of each one: recorded, duplicate, or failed with the reason. Up to 200 at a time.')
            .split(/(\{ref\}|\{service\})/).map((part, i) => (part === '{ref}' || part === '{service}' ? <code key={i}>{part.slice(1, -1)}</code> : part))}</p>
          <div className="row"><Button kind="ghost" onClick={() => copy(example)}>Copy the example</Button></div>
        </details>
      </div>
    </Card>
  );
}
