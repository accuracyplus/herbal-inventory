// Dates read dd-mm-yyyy, always (Design Guide D-090, Sinu 24 Nov 2026: "date in dd-mm-yyyy format
// always"): the server's words, PDFs and emails use dmy() from lib/data.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dmy, monthWords } from '../src/lib/data.js';

test('dmy: a calendar day as written, a moment as its day in the Gulf, leading zeros, nothing for none', () => {
  assert.equal(dmy('2026-11-03'), '03-11-2026');
  assert.equal(dmy('2026-01-09'), '09-01-2026');
  assert.equal(dmy('2026-11-24T19:59:00.000Z'), '24-11-2026');   // 23:59 in the Gulf
  assert.equal(dmy('2026-11-24T20:00:00.000Z'), '25-11-2026');   // midnight in the Gulf
  assert.equal(dmy(''), '');
  assert.equal(dmy(null), '');
  assert.equal(dmy('not a date'), '');
});

test('monthWords: a month is a month, not a date', () => {
  assert.equal(monthWords('2026-11'), 'November 2026');
  assert.equal(monthWords('2026-01-15'), 'January 2026');
  assert.equal(monthWords(''), '');
});
