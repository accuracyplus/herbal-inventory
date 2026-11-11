/**
 * The Excel and CSV reader and writer the bulk upload page uses (client/src/sheet.js). It is plain
 * JavaScript, so it is tested here with everything else; it needs the client's packages, and is
 * skipped with a reason on a checkout where `cd client && npm install` has not been run yet.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

let sheet = null;
let fflate = null;
let why = false;
try {
  sheet = await import('../client/src/sheet.js');
  fflate = await import('../client/node_modules/fflate/esm/index.mjs');
} catch {
  why = 'client packages are not installed (cd client && npm install)';
}

const columns = [{ header: 'Code', text: true, width: 12 }, { header: 'Name' }, { header: 'Barcode', text: true }, { header: 'Cost' }];

test('xlsx: what is written is read back the same, leading zeros and other alphabets included', { skip: why }, () => {
  const rows = [
    ['0007', 'Dhanwantharam & <thailam> "oil"', '0123456789012', 12.5],
    ['HP-2', 'ധന്വന്തരം തൈലം · زيت', '6291041500213123456', 0],
    ['HP-3', null, null, null],
  ];
  const back = sheet.readTable(sheet.writeXlsx({ sheet: 'Items', columns, rows }));
  assert.deepEqual(back.headers, ['Code', 'Name', 'Barcode', 'Cost']);
  assert.deepEqual(back.rows, rows);
  assert.equal(typeof back.rows[0][2], 'string');
  assert.equal(typeof back.rows[0][3], 'number');
});

test('xlsx: text columns are text for the whole column, and the heading row is frozen', { skip: why }, () => {
  const files = fflate.unzipSync(sheet.writeXlsx({ columns, rows: [] }));
  const xml = fflate.strFromU8(files['xl/worksheets/sheet1.xml']);
  assert.match(xml, /<col min="1" max="1" width="12" customWidth="1" style="1"\/>/);
  assert.match(xml, /<col min="3" max="3"[^>]*style="1"/);
  assert.doesNotMatch(xml, /<col min="2"[^>]*style=/);
  assert.match(xml, /state="frozen"/);
  assert.match(fflate.strFromU8(files['xl/styles.xml']), /numFmtId="49"/);
});

test('xlsx: a workbook as Excel saves it, with shared strings, numbers, gaps and a renamed sheet file', { skip: why }, () => {
  const x = (s) => fflate.strToU8(`<?xml version="1.0" encoding="UTF-8"?>${s}`);
  const book = fflate.zipSync({
    'xl/workbook.xml': x('<workbook xmlns:r="r"><sheets><sheet name="Data" sheetId="5" r:id="rId7"/><sheet name="Other" sheetId="6" r:id="rId8"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': x('<Relationships><Relationship Id="rId8" Target="worksheets/sheet2.xml"/><Relationship Id="rId7" Target="worksheets/data.xml"/></Relationships>'),
    'xl/sharedStrings.xml': x('<sst><si><t>Code</t></si><si><t>Name</t></si><si><r><t>Kizhi </t></r><r><rPr><b/></rPr><t xml:space="preserve">powder &amp; oil</t></r></si><si><t>読<rPh><t>ヨ</t></rPh></t></si><si/></sst>'),
    'xl/worksheets/sheet2.xml': x('<worksheet><sheetData><row r="1"><c r="A1"><v>999</v></c></row></sheetData></worksheet>'),
    'xl/worksheets/data.xml': x('<worksheet><sheetData>'
      + '<row r="1" spans="1:3"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="D1" t="inlineStr"><is><t>Cost</t></is></c></row>'
      + '<row r="3"><c r="A3"><v>6291041500213</v></c><c r="B3" t="s"><v>2</v></c><c r="C3" s="4"/><c r="D3"><v>1.25E1</v></c></row>'
      + '<row r="4"><c r="A4" t="str"><f>"A"&amp;"1"</f><v>A1</v></c><c r="B4" t="s"><v>3</v></c><c r="C4" t="b"><v>1</v></c><c r="D4" t="e"><v>#N/A</v></c></row>'
      + '</sheetData></worksheet>'),
  });
  const t = sheet.readTable(book);
  assert.deepEqual(t.headers, ['Code', 'Name', '', 'Cost']);
  assert.deepEqual(t.rows, [[null, null, null, null], [6291041500213, 'Kizhi powder & oil', null, 12.5], ['A1', '読', true, null]]);
});

test('csv: quotes, line breaks inside a cell, semicolons, and Excel\'s byte-order mark', { skip: why }, () => {
  const enc = (s) => new TextEncoder().encode(s);
  const a = sheet.readTable(enc('﻿Code,Name,Barcode\r\nA1,"Oil, ""best""",0123\r\nA2,"two\nlines",\r\n'));
  assert.deepEqual(a.headers, ['Code', 'Name', 'Barcode']);
  assert.deepEqual(a.rows, [['A1', 'Oil, "best"', '0123'], ['A2', 'two\nlines', null]]);
  const b = sheet.readTable(enc('Code;Name\nA1;One, with a comma\n'));
  assert.deepEqual(b.rows, [['A1', 'One, with a comma']]);
  const back = sheet.readTable(enc(sheet.toCsv(columns, [['0007', 'A "b", c', '0123', 2]])));
  assert.deepEqual(back.rows, [['0007', 'A "b", c', '0123', '2']]);
});

test('files that are not a sheet say so in words', { skip: why }, () => {
  assert.throws(() => sheet.readTable(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])), /old \.xls workbook/);
  assert.throws(() => sheet.readTable(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3])), /not a readable Excel workbook/);
  assert.throws(() => sheet.readTable(new TextEncoder().encode('\n\n')), /empty/);
});
