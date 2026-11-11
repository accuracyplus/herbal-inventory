/**
 * Reading and writing the sheets for bulk upload: Excel (.xlsx) and CSV.
 *
 * Written here rather than taken from a spreadsheet library for one reason: the template's code,
 * barcode, phone and TRN columns must be TEXT for the whole column, so that a barcode typed into
 * a new row is kept as typed. Excel otherwise shows 6291041500213 as 6.29104E+12, rounds past 15
 * digits and drops a leading zero. An .xlsx file is a zip of small XML files; `fflate` does the
 * zip, bundled with the app like everything else (CSP allows scripts from self only).
 *
 * A cell comes back as a string, a number (a numeric cell), a boolean, or null. Numbers are left
 * as numbers on purpose: the server can then tell "Excel treated this barcode as a quantity".
 */

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PKG = 'http://schemas.openxmlformats.org/package/2006';

// Characters XML cannot carry are dropped, not escaped.
const esc = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
  const k = e.toLowerCase();
  if (k[0] === '#') return String.fromCodePoint(k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[k];
});

function colName(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}
const colIndex = (letters) => [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

// Styles: 0 general, 1 text (number format 49, "@"), 2 bold text for the heading row.
const STYLES = `${XML}<styleSheet xmlns="${MAIN}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>`
  + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs></styleSheet>';

/**
 * One sheet. columns: [{ header, text, width }]; rows: arrays in column order.
 * A `text` column is text all the way down, including rows not written yet.
 */
export function writeXlsx({ sheet = 'Sheet1', columns, rows }) {
  const cell = (r, c, v, style) => {
    const ref = `${colName(c)}${r}`;
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'number' && Number.isFinite(v) && !style) return `<c r="${ref}"><v>${v}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  };
  const head = `<row r="1">${columns.map((c, i) => cell(1, i, c.header, 2)).join('')}</row>`;
  const body = rows.map((r, n) => `<row r="${n + 2}">${columns.map((c, i) => cell(n + 2, i, r[i], c.text ? 1 : 0)).join('')}</row>`).join('');
  const cols = columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 14}" customWidth="1"${c.text ? ' style="1"' : ''}/>`).join('');
  const sheetXml = `${XML}<worksheet xmlns="${MAIN}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    + `<cols>${cols}</cols><sheetData>${head}${body}</sheetData></worksheet>`;
  const name = esc(String(sheet).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
  return zipSync({
    '[Content_Types].xml': strToU8(`${XML}<Types xmlns="${PKG}/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>`
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'),
    '_rels/.rels': strToU8(`${XML}<Relationships xmlns="${PKG}/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`${XML}<workbook xmlns="${MAIN}" xmlns:r="${REL}"><bookViews><workbookView/></bookViews><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`${XML}<Relationships xmlns="${PKG}/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/></Relationships>`),
    'xl/styles.xml': strToU8(STYLES),
    'xl/worksheets/sheet1.xml': strToU8(sheetXml),
  });
}

/** The text of a string item: every <t>, without the phonetic guides East Asian text carries. */
const textOf = (xml) => [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => unesc(m[1])).join('');
const attr = (s, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(s)?.[1] ?? null;

/** The first sheet of an .xlsx file, as rows of cells. */
export function readXlsx(bytes) {
  let files;
  try { files = unzipSync(bytes); } catch { throw new Error('That file is not a readable Excel workbook. Save it as .xlsx and try again.'); }
  const read = (path) => (files[path] ? strFromU8(files[path]) : null);
  const workbook = read('xl/workbook.xml');
  if (!workbook) throw new Error('That file is not an Excel workbook. Save it as .xlsx and try again.');
  // The first sheet in the workbook's own order, wherever its file is kept.
  let path = 'xl/worksheets/sheet1.xml';
  const first = /<sheet\b[^>]*>/.exec(workbook)?.[0];
  const rid = first && (attr(first, 'r:id') || attr(first, 'id'));
  const rels = read('xl/_rels/workbook.xml.rels');
  if (rid && rels) {
    const rel = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0]).find((r) => attr(r, 'Id') === rid);
    const target = rel && attr(rel, 'Target');
    if (target) path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
  }
  const sheet = read(path);
  if (!sheet) throw new Error('The first sheet of that workbook could not be read.');
  const shared = [...(read('xl/sharedStrings.xml') || '').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g)].map((m) => textOf(m[1] || ''));

  const rows = [];
  let n = 0;
  for (const rm of sheet.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    n = Number(attr(rm[1], 'r')) || n + 1;
    const row = [];
    let c = -1;
    for (const cm of (rm[2] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(cm[1], 'r');
      c = ref ? colIndex(ref.replace(/\d+$/, '')) : c + 1;
      const type = attr(cm[1], 't');
      const inner = cm[2] || '';
      const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let value = null;
      if (type === 'inlineStr') value = textOf(inner);
      else if (v === undefined || v === '') value = null;
      else if (type === 's') value = shared[Number(v)] ?? null;
      else if (type === 'str') value = unesc(v);
      else if (type === 'b') value = v === '1';
      else if (type === 'e') value = null;
      else value = Number(v);
      if (value === '') value = null;
      row[c] = value;
    }
    rows[n - 1] = Array.from(row, (x) => (x === undefined ? null : x));
  }
  return Array.from(rows, (r) => r || []);
}

/** CSV with quotes, embedded line breaks, and whichever of , ; or tab the first line uses. */
export function parseCsv(input) {
  const text = input.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const count = (ch) => firstLine.split(ch).length - 1;
  const sep = [',', ';', '\t'].sort((a, b) => count(b) - count(a))[0];
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.map((r) => r.map((c) => (c.trim() === '' ? null : c)));
}

/** A chosen file as { headers, rows }: Excel by its content, anything else as CSV. */
export function readTable(bytes) {
  let rows;
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) rows = readXlsx(bytes);
  else if (bytes[0] === 0xd0 && bytes[1] === 0xcf) throw new Error('That is an old .xls workbook. Open it in Excel and save it as .xlsx (Excel Workbook), then choose it again.');
  else rows = parseCsv(new TextDecoder(bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : 'utf-8').decode(bytes));
  const top = rows.findIndex((r) => r.some((c) => c !== null && String(c).trim() !== ''));
  if (top < 0) throw new Error('That file is empty.');
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r) => Array.from({ length: width }, (_, i) => r[i] ?? null);
  return { headers: pad(rows[top]).map((h) => (h === null ? '' : String(h))), rows: rows.slice(top + 1).map(pad) };
}

export function toCsv(columns, rows) {
  const q = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return `﻿${[columns.map((c) => q(c.header)).join(','), ...rows.map((r) => columns.map((_, i) => q(r[i])).join(','))].join('\r\n')}`;
}
