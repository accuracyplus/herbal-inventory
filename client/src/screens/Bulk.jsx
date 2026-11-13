/**
 * Bulk upload: download the list as an Excel sheet, edit it, send it back. The file is always
 * checked first, and the check changes nothing; saving is all of it or none of it.
 *
 * The sheet reader (and the zip library under it) loads only when a file or template is asked for.
 */

import { useState } from 'react';
import { post } from '../api.js';
import Icon from '../icons.jsx';
import { Button, Card, ErrorNote, Field, Loading, Note, Pill, Quiet, Segmented, useApp, useData } from '../ui.jsx';
import { t, tn } from '../i18n.js';

const ACTION = { add: ['ok', 'Add'], change: ['brand', 'Change'], same: ['faint', 'No change'], problem: ['danger', 'Problem'] };
const SHOWN = 200;

function saveFile(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export default function Bulk() {
  const { can, toast, refreshStock } = useApp();
  const kinds = [
    can('items.edit') && { value: 'items', label: 'Items' },
    can('supplier.edit') && { value: 'suppliers', label: 'Suppliers' },
    can('admin') && { value: 'areas', label: 'Rooms & areas' },
  ].filter(Boolean);
  const [kind, setKind] = useState(kinds[0]?.value);
  const tpl = useData(kind ? `/api/bulk/${kind}/template` : null, [kind]);
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [show, setShow] = useState('attention');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [pick, setPick] = useState(0);
  const clear = () => { setFile(null); setReport(null); setErr(null); setShow('attention'); setPick((n) => n + 1); };

  const download = async (format) => {
    setErr(null);
    try {
      const sheet = tpl.data;
      const { writeXlsx, toCsv } = await import('../sheet.js');
      saveFile(format === 'xlsx'
        ? new Blob([writeXlsx({ sheet: sheet.sheet, columns: sheet.columns, rows: sheet.rows })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        : new Blob([toCsv(sheet.columns, sheet.rows)], { type: 'text/csv;charset=utf-8' }), `${sheet.fileName}.${format}`);
    } catch (e) { setErr(e); }
  };

  const choose = async (f) => {
    setErr(null); setReport(null); setFile(null); setShow('attention');
    if (f.size > 5e6) { setErr(new Error('That file is over 5 MB. A sheet of items is far smaller: check it is the right file.')); return; }
    setBusy(true);
    try {
      const { readTable } = await import('../sheet.js');
      const table = readTable(new Uint8Array(await f.arrayBuffer()));
      setFile({ name: f.name, table });
      setReport(await post(`/api/bulk/${kind}`, { ...table, dryRun: true }));
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await post(`/api/bulk/${kind}`, { ...file.table, dryRun: false });
      setReport(r);
      toast(t('Saved: {add} added, {change} changed', { add: r.summary.add, change: r.summary.change }));
      refreshStock(); tpl.reload();
    } catch (e) {
      setErr(e);
      if (e.details?.report) setReport(e.details.report);   // it changed since the check: show why
    } finally { setBusy(false); }
  };

  if (!kinds.length) return null;
  const s = report?.summary;
  const todo = s ? s.add + s.change : 0;
  const rows = !report ? [] : report.rows.filter((r) => (
    show === 'all' ? true : show === 'changes' ? ['add', 'change'].includes(r.action) : r.action === 'problem' || r.notes.length > 0));
  const what = t(kinds.find((k) => k.value === kind)?.label)?.toLowerCase();

  return (
    <div className="stack">
      {kinds.length > 1 && <Segmented label="List" value={kind} onChange={(k) => { setKind(k); clear(); }} options={kinds} />}

      <Card title="1 · Get the sheet" hint="It comes filled with what this unit already has. Change what you need, add rows for new ones, and leave the rest.">
        {tpl.loading && !tpl.data && <Loading />}
        <ErrorNote error={tpl.error} onRetry={tpl.reload} />
        {tpl.data && (
          <div className="stack">
            <div className="scan-row">
              <Button icon="download" onClick={() => download('xlsx')}>Excel sheet</Button>
              <Button kind="ghost" icon="download" onClick={() => download('csv')}>CSV</Button>
              <span className="muted" style={{ alignSelf: 'center' }}>{t('{n} {what} in it now', { n: tpl.data.rows.length, what })}</span>
            </div>
            <p className="muted">{t('A blank cell leaves that detail as it is. A row whose {column} is not here yet is added as new. Nothing is ever deleted by an upload.', { column: tpl.data.columns.find((c) => c.required)?.header.toLowerCase() })}</p>
            <ul className="lots">
              {tpl.data.columns.filter((c) => c.hint).map((c) => (
                <li key={c.header} className="lot"><div className="min0"><span className="row-label">{c.header}</span><span className="row-sub">{t(c.hint)}</span></div></li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="2 · Choose the filled-in file" hint="Excel (.xlsx) or CSV. It is checked straight away, and checking changes nothing.">
        <Field label="File"><input key={pick} type="file" accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => e.target.files[0] && choose(e.target.files[0])} /></Field>
        {busy && !report && <Loading what="Checking the file" />}
      </Card>

      <ErrorNote error={err} />

      {report && (
        <Card title={report.applied ? '3 · Saved' : '3 · What this file would do'} actions={file && <span className="muted">{file.name}</span>}>
          <div className="stack">
            <dl className="hf-kv hf-kv--3">
              <div><dt>{t(report.applied ? 'Added' : 'To add')}</dt><dd>{s.add}</dd></div>
              <div><dt>{t(report.applied ? 'Changed' : 'To change')}</dt><dd>{s.change}</dd></div>
              <div><dt>{t('No change')}</dt><dd>{s.same}</dd></div>
              <div><dt>{t('Problems')}</dt><dd className={s.problems ? 'tone-txt-CRITICAL' : ''}>{s.problems}</dd></div>
            </dl>
            {report.ignored.length > 0 && <Note tone="warn" icon="alert"><span>{t('These columns are not part of this sheet and were ignored:')} <b>{report.ignored.join(', ')}</b>. {t('If one is a misspelt heading, fix it and choose the file again.')}</span></Note>}
            {report.applied && <Quiet>Saved. Download the sheet again before the next round of changes, so it starts from what is here now.</Quiet>}
            {!report.applied && s.problems > 0 && <Note tone="danger" icon="alert" role="alert"><span>{tn(s.problems, 'Nothing can be saved until the row below is fixed in the file. Then choose it again.', 'Nothing can be saved until the {n} rows below are fixed in the file. Then choose it again.')}</span></Note>}
            {!report.applied && !s.problems && !todo && <Quiet>The file matches what is already here. There is nothing to save.</Quiet>}

            <Segmented label="Show" value={show} onChange={setShow} options={[
              { value: 'attention', label: 'To look at', n: report.rows.filter((r) => r.action === 'problem' || r.notes.length).length },
              { value: 'changes', label: 'Adds and changes', n: todo },
              { value: 'all', label: 'Every row' },
            ]} />
            {!rows.length && <Quiet>{show === 'attention' ? 'No problems, and nothing to look at.' : 'Nothing in this view.'}</Quiet>}
            <ul className="lots">
              {rows.slice(0, SHOWN).map((r) => (
                <li key={r.row} className="lot">
                  <div className="min0">
                    <span className="row-label">{t('Row {n}', { n: r.row })} · {r.key || t('no code')}{r.name && r.name !== r.key ? ` · ${r.name}` : ''} <Pill tone={ACTION[r.action][0]}>{ACTION[r.action][1]}</Pill></span>
                    {r.problems.map((p) => <span key={p} className="row-sub tone-txt-CRITICAL">{t(p)}</span>)}
                    {r.notes.map((n) => <span key={n} className="row-sub">{t('Check: {note}', { note: t(n) })}</span>)}
                    {r.action === 'change' && r.changes.map((c) => <span key={c} className="row-sub">{c}</span>)}
                  </div>
                </li>
              ))}
            </ul>
            {rows.length > SHOWN && <p className="muted">{t('And {n} more rows like these.', { n: rows.length - SHOWN })}</p>}

            {!report.applied && (
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Button kind="secondary" onClick={clear}>Choose another file</Button>
                <Button busy={busy} icon="check" onClick={save}>{todo && !s.problems ? tn(todo, 'Save {n} change', 'Save {n} changes') : 'Save'}</Button>
              </div>
            )}
            {report.applied && <div className="row" style={{ justifyContent: 'flex-end' }}><Button kind="secondary" onClick={clear}>Upload another file</Button></div>}
          </div>
        </Card>
      )}
    </div>
  );
}
