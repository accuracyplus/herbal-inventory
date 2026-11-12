/**
 * A purchase order as a PDF, for the supplier.
 *
 * Made with pdf-lib, as HiFive ID makes its letters. Plain on purpose: it is read by somebody
 * outside the group, often printed, so it carries no theme, only black text and a grey rule.
 *
 * The built-in fonts hold Western letters only. A name in another script is written with "?"
 * in place of what cannot be drawn, rather than failing the whole order.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const W = 595.28; const H = 841.89; const M = 48; // A4, in points
const INK = rgb(0.1, 0.1, 0.1); const SOFT = rgb(0.38, 0.38, 0.38); const RULE = rgb(0.8, 0.8, 0.8);

export const plain = (s) => String(s ?? '')
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, ' ')
  .replace(/[^\x20-\x7E\xA1-\xFF]/g, '?').trim();

const money = (n, cur) => `${cur} ${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qty = (n) => String(Math.round(Number(n) * 1000) / 1000);
const day = (iso) => { if (!iso) return ''; const d = new Date(String(iso).length <= 10 ? `${iso}T00:00:00Z` : Date.parse(iso) + 4 * 3600e3); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); };

/** Break text into lines no wider than `max` points. A single word longer than the line is cut. */
function wrap(font, size, text, max) {
  const out = []; let line = '';
  for (let word of plain(text).split(' ')) {
    while (font.widthOfTextAtSize(word, size) > max) {
      let n = word.length; while (n > 1 && font.widthOfTextAtSize(word.slice(0, n), size) > max) n -= 1;
      if (line) { out.push(line); line = ''; }
      out.push(word.slice(0, n)); word = word.slice(n);
    }
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > max && line) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

/**
 * `po` is what getPo returns (header, supplier, store, lines); `unitName` heads the page.
 * Returns the bytes. Long orders run onto as many pages as they need; each says "Page n of N".
 */
export async function poPdf(po, { unitName, currency = 'AED' }) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(plain(`Purchase order ${po.ref}`));
  doc.setAuthor(plain(unitName));
  doc.setCreator('HiFive Inventory');

  let page; let y;
  const write = (t, x, size = 10, f = font, colour = INK) => page.drawText(plain(t), { x, y, size, font: f, color: colour });
  const right = (t, x, size = 10, f = font, colour = INK) => { const s = plain(t); page.drawText(s, { x: x - f.widthOfTextAtSize(s, size), y, size, font: f, color: colour }); };
  const rule = () => page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 0.7, color: RULE });

  // Columns: code, item (wraps), quantity, unit price, total.
  const X = { code: M, item: M + 78, qty: W - M - 190, price: W - M - 96, total: W - M };
  const itemWidth = X.qty - 62 - X.item;
  const tableHead = () => {
    write('CODE', X.code, 8, bold, SOFT); write('ITEM', X.item, 8, bold, SOFT);
    right('QUANTITY', X.qty, 8, bold, SOFT); right('UNIT PRICE', X.price, 8, bold, SOFT); right('TOTAL', X.total, 8, bold, SOFT);
    y -= 8; rule(); y -= 12;
  };
  const newPage = (continued) => {
    page = doc.addPage([W, H]); y = H - M;
    write(unitName, M, 16, bold); right('Purchase order', W - M, 16, bold); y -= 20;
    write(po.ref, M, 11, bold, SOFT); if (continued) right('continued', W - M, 10, font, SOFT); y -= 22;
    if (continued) tableHead();
  };

  newPage(false);
  const facts = [
    ['Date', day(po.decided_at || po.created_at)], ['Deliver to', po.store_name], ['Expected by', day(po.expected_date)],
    ['Approved by', po.decided_by_name && po.status !== 'REJECTED' ? po.decided_by_name : ''], ['Ordered by', po.created_by_name],
  ].filter(([, v]) => v);
  const who = [po.supplier_name, po.supplier_contact, po.supplier_phone, po.supplier_email, po.supplier_trn && `TRN ${po.supplier_trn}`].filter(Boolean);
  const top = y;
  write('TO', M, 8, bold, SOFT); y -= 14;
  who.forEach((t, i) => { for (const l of wrap(i ? font : bold, 10, t, 250)) { write(l, M, 10, i ? font : bold); y -= 13; } });
  const leftEnd = y;
  y = top;
  for (const [k, v] of facts) { write(k.toUpperCase(), W - M - 220, 8, bold, SOFT); for (const l of wrap(font, 10, v, 130)) { write(l, W - M - 130, 10); y -= 13; } }
  y = Math.min(y, leftEnd) - 18;

  tableHead();
  for (const l of po.lines) {
    // Ordered in a pack: the supplier's own way of saying it, under the name.
    const asPack = l.pack_label && l.pack_qty
      ? [`${qty(l.pack_qty)} x ${plain(l.pack_label)}${l.pack_cost != null ? ` at ${money(l.pack_cost, currency)} each` : ''}`]
      : [];
    const name = [...wrap(font, 10, l.name, itemWidth), ...asPack.flatMap((t) => wrap(font, 10, t, itemWidth))];
    if (y - name.length * 13 < M + 70) newPage(true);
    write(l.code, X.code, 9, font, SOFT);
    right(`${qty(l.qty)} ${plain(l.uom)}`, X.qty); right(money(l.unit_cost, currency), X.price); right(money(l.qty * l.unit_cost, currency), X.total);
    for (const part of name) { write(part, X.item); y -= 13; }
    y -= 4;
  }
  y -= 2; rule(); y -= 14;
  right('Total', X.price, 11, bold); right(money(po.total, currency), X.total, 11, bold); y -= 24;
  if (po.note) {
    if (y < M + 80) newPage(false);
    write('NOTE', M, 8, bold, SOFT); y -= 14;
    for (const l of wrap(font, 10, po.note, W - 2 * M)) { write(l, M); y -= 13; }
  }

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    page = p; y = M - 18;
    write(`${plain(unitName)} · ${po.ref}`, M, 8, font, SOFT); right(`Page ${i + 1} of ${pages.length}`, W - M, 8, font, SOFT);
  });
  return doc.save();
}
