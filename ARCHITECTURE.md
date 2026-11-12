# HiFive Inventory — Architecture

Built on the HiFive Recruitment platform shape, with Transport's decided departure: **D1 is the
system of record for every table; there is no workbook.** The old Google Sheet is read once, by
the import, and then retired.

## 1. Shape

| Layer | Inventory | Same as |
|---|---|---|
| Client | Vite + React SPA on Cloudflare Pages, installable PWA (`client/`) | Transport |
| Edge | One Worker, one router, `src/worker.js` | Recruitment, Transport |
| Auth | `resolveAuthContext()` in `src/lib/auth.js` is the only place a role is decided | Recruitment, Transport |
| Sign-in | HiFive ID only (RS256 via the `HFID` service binding). No PIN. | Transport, minus PIN |
| Data | D1, system of record; ledger and audit log append-only by trigger | Transport |
| Design | HiFive design tokens from `hifive-design.pages.dev/theme/v1`, local fallback copy | Design Guide Part J |
| Config | `wrangler.toml` is the single source of truth | all |

No cron trigger, because nothing needs one: alerts are computed when Today opens, and HiFive ID
asks for its hub, morning email and profile itself (section 4).

## 2. Units and access

- `units` — one per HiFive business. `name` must match the HiFive ID entity name.
- `staff` — one row per person, keyed by HiFive ID **employee code** (the sign-in join).
- `staff_units` — a person's roles in a unit, optionally limited to some stores.
- `departments` — per unit; every room or bench (`areas`) belongs to one once the unit has any.
- The client sends `x-unit`; the server checks the seat and fences every query on that unit.
  Another unit's records answer 404, never 403.
- `staff.group_admin` = every unit, every role — only while HiFive ID also says `admin`/`hr`.

Roles: **Staff** (use, linen, request), **Store keeper**, **Purchasing**, **Manager** (approves),
**Unit administrator**, **Viewer** (read-only, enforced at the choke point). The whole matrix is
`RULES` in `src/domain/access.js`; the Help screen prints the same table.

**Four eyes:** nobody approves a request, purchase order, correction or count they raised —
unless they are the only manager in the unit, so a small unit is never stuck.

## 3. The ledger

`src/domain/stock.js` is the only writer of `balances`, `batches` and `movements`. Every document
hands it lines; it checks the shelf, picks batches first-expiry-first, and returns statements the
caller runs in **one D1 batch** with its own rows and the audit row. A receipt can never exist
without its stock, nor stock without its receipt.

- `movements` and `audit_log` are append-only (triggers in `schema.sql`). Mistakes are corrected
  by a correcting movement, never by editing one.
- `balances.qty`, `in_use`, `in_wash` and `batches.qty` carry `CHECK (>= 0)`: the backstop for
  two people taking the last bottle in the same second. A negative change is a plain `UPDATE`,
  because SQLite checks CHECK on an upsert's insert row before resolving the conflict.
- Weighted average cost moves on receipts only; issues and write-offs are valued at it.
- Linen: `qty` is clean on the shelf; pieces move to `in_use` (rooms) and `in_wash` (laundry) and
  back; the total changes only on receipt or discard.
- Counts snapshot the system quantity at the start and post `counted − snapshot` to the balance
  at approval, so stock used while the shelf was counted is not taken twice.

- Use: every `ISSUE` goes through `src/domain/consumption.js`, which applies the unit's
  `consumption.record` setting (room, person, or both; both by default). `person_id`,
  `person_name` and `department_id` are copied onto the movement, so moving a room to another
  department later does not rewrite past figures. Staff record as themselves; `use.for_others`
  lets store roles name somebody else. Stock given out against a request goes on the requester.

- Custody: `custody` holds stock somebody has taken, one row per take and batch, so each has its
  own age. A `TAKE` movement takes it off the shelf. Recorded as used it becomes an `ISSUE` with
  `from_state = 'custody'`, which does not touch the shelf again and is valued at the cost when
  taken; returned it is a `RETURN` into the same batch. Held stock still belongs to the unit, so
  it counts in stock value and average cost. Only `ISSUE` is consumption.
- Unaccounted: held past the unit's `custody.account_hours` (24 by default). A person sees their
  own; `custody.team` (Manager, Unit administrator, and so group administrators) sees the unit's
  in name order, with no totals.

## 3a. Scanning

- `src/domain/scanning.js`. A barcode is found on `items.barcode` or `item_barcodes` (a second
  pack, a case); it belongs to one item per unit, checked in both places on every save.
- Phone pairing: the computer opens a `scan_sessions` row and shows it as a QR code; the phone,
  signed in as the same person in the same unit, posts scans; the computer polls
  `GET /api/scan/sessions/:id?after=seq` every 1.5 s. Polling rather than a Durable Object: it
  needs nothing beyond D1, runs in the tests as in production, and reads only while a pairing is
  open. A pairing ends when closed, 15 minutes after the last scan, or 4 hours after opening;
  rows go after two days. Scans only fill in a form; nothing in scanning moves stock.
- The camera reads with the browser's BarcodeDetector where there is one, otherwise ZXing,
  bundled and loaded on demand (`client/src/scan/reader.js`): CSP allows scripts from self only.
  `_headers` allows the camera for this origin (`camera=(self)`).

## 3d. Services and their recipes

- `src/domain/services.js`. A service (`services`, with `service_items` as its recipe) is what
  one treatment or one lab test normally uses; the unit chooses the word (`services.word`).
  Recording one is ordinary use: `ISSUE` movements through the stock engine in one batch, with
  the room, person and department decided by `consumption.js` like every other use.
- The recipe fills the form and can be changed before saving. `service_record_lines` keeps the
  recipe's quantity for the number done (`std_qty`) beside what was used (`qty`) and the cost at
  the time, so a later change to a recipe does not rewrite the past.
- The services report is a sum over those lines: by service, item and room, and by person for
  `cost.people` in name order. Linen is never part of a recipe.

## 3e. Services arriving from bookings or billing

- `src/domain/servicelink.js`. Another system sends each completed service to
  `POST /hooks/services` with `Authorization: Bearer <key>`. A key (`integration_keys`) belongs to
  one unit and one store, is shown once when made, and only its SHA-256 is kept. There is no
  session on this route: the key is the whole identity, and the row is recorded as
  `link:<key name>`.
- Each row carries its own reference (`ext_ref`, the booking or invoice line). The unique index
  on `service_records (unit_id, ext_ref)` and on `service_inbox (unit_id, ext_ref)` makes a row
  sent twice count once, whichever way it arrives.
- Recording is `postService` in `services.js`, the same core the signed-in screen uses, so the
  stock engine, the audit row and the room/person rules are identical. A row that cannot be
  recorded (unknown service, room or person; not enough stock) is kept in `service_inbox` with
  the sentence a manager can act on, and shows on Today for `services.edit` until it is retried
  or dismissed with a reason. Each row is its own batch: one failure never holds back the rest.
- The same rows can come from a sheet (`/api/link/sheet`): checked first, nothing saved until
  the person says so. This is the route until a booking or billing system is connected.
- `services.price` is the usual price; a row may carry its own. The price actually used is kept
  on the record, so the margin report (charged against cost of what was used, `cost.view` only)
  does not move when a price list changes. Records with no price are counted and left out.

## 3c. Deliveries, their paperwork, and reading the note

- `src/domain/receipts.js`. A delivery is recorded by the receiver as `PENDING` with its lines
  (`receipt_lines`: counted, what the note says, what the order still expected and its price),
  and posts stock only when somebody else approves (`receipt.decide`, four eyes). `receipt_posted`
  has the receipt as its primary key and is written in the posting batch, so two approvals cannot
  put stock on the shelf twice. `receipts.approval = none` posts at once.
- Differences are derived from the lines, never stored: counted against the note, the note
  against the order's outstanding quantity, and the price against the order's.
- Files (`src/lib/files.js`): R2 bucket `FILES`, private, keyed `unit/receipt/<id>/<sha256>.<ext>`.
  D1 `files` holds kind, uploader, time and SHA-256; the type is judged from the bytes; the digest
  is checked again on every read. Served only through the Worker, to the unit. Approval needs a
  delivery note or invoice unless `receipts.note = optional`. Files cannot be removed once the
  delivery is decided.
- Reading (`src/domain/notes.js`): Workers AI, a list of vision models tried in order, JSON by
  schema with every field required. A suggestion only: it fills the Receive form. A supplier's
  wording is remembered in `supplier_item_map` (text, item, units per note unit) when the
  receiver records the delivery, so a correction replaces it.

## 3b. Bulk upload

- `src/domain/bulk.js`: items, suppliers, rooms and areas. The page reads the file
  (`client/src/sheet.js`, Excel or CSV) and sends headings and rows; the server decides. A check
  reports each row as add, change, no change or problem and changes nothing; applying re-checks
  and saves only a file with no problems, in one batch. Rows match on code (items, rooms) or name
  (suppliers); a blank cell leaves the field alone; nothing is deleted.
- Master data only: no balances, batches or movements. Switching expiry tracking or linen on an
  item that holds stock is refused and sent to the item's own screen.
- New rows go in as multi-row inserts (D1 binds 100 values a statement), so a first load of
  several hundred items fits in one request; past 800 statements the file is refused.
- The template is the unit's own list. Its code, barcode, phone and TRN columns are Text for the
  whole column, which is why `sheet.js` writes .xlsx itself (on `fflate`) rather than through a
  library that cannot. Checked in Excel 16: opens clean, typed leading zeros are kept.

## 4. HiFive ID

| Route | Who calls it | Guard |
|---|---|---|
| `POST /auth/hfid/exchange` | this app's page, with `?hfid_code=` | the one-time code; swapped through the `HFID` binding, app `inventory` |
| `POST /auth/hfid/arrived` | this app's page, once per sign-in | the user's token; recorded once per token digest, links `hfid_sub` |
| `POST /pending/service` | the hub's "Waiting for you" | assertion with `svc: pending`; answers for the named emp_code only |
| `POST /pending/service/all` | the combined morning email (`digest.ts`), once a morning | `svc: pending-all` only; `{ people: [{ emp_code, name, items }] }` |
| `POST /accountability/service` | the person's HiFive ID profile | `svc: accountability`, the named emp_code only; `{ person }`, null if unknown here |
| `POST /accountability/service/all` | HiFive ID's nightly copy | `svc: accountability-all` only; `{ people: [...] }`, holding 0 included |
| `GET /api/roster` | weekly reconciliation | admin/hr assertion for this audience |
| `GET/PUT /api/roles/:empId` | the HiFive ID admin console | console session (`aud`/`module` = `hifive-id`), admin/hr |

**One waiting list** (`src/domain/waiting.js`). Today, the hub and the morning email are all made
from it, so they never disagree. The queries are per unit, grouped by who raised each thing
(`unitFacts`), and each person's list is worked out from those facts (`waitingList`, pure), so
everybody's list costs about a dozen reads per unit. Each item carries `days` (negative = days
late; 0 = today) and, for held stock and packs past their date, `due: 'overdue'`:

- an approval is due the day it was raised, a day late for each day after, by its oldest;
- held stock is late from the moment the unit's window (`custody.account_hours`) ran out;
- orders expected are as late as the first late one, or as far off as the next one due.

An item with no day (an order with no expected date, a count in progress) stays on Today but is
not sent: HiFive ID's email files an undated item under "due today", every day. Links are
`/#/<screen>?…&unit=<id>`; the app switches to that unit on arrival. Somebody with seats in two
units reads "… at Herbal Park" in the text; the unit is always in `detail`. A group administrator
is listed only for the units they hold a seat in. The administrator's "changes from HiFive ID to
review" line stays on Today only: it needs the administrator's own session.

**Stock in hand** for the profile is counts and dates only: lines held, lines past the unit's
window, the day the oldest of those was taken, per unit, with a link to With me. Never item
names, never money; who may see a person's profile is HiFive ID's decision, and the detail stays
behind Inventory's own sign-in.

Inventory also reads HiFive ID: `GET /roster?app=inventory` (`src/lib/roster.js`, the shape of
Transport's), with the administrator's own session, when Admin → People or Today opens. It is
compared with the unit's seats: a picker of everybody still working, and a review of recent
joiners (30 days), leavers, people on notice, names that differ and codes HiFive ID does not hold.
Nothing is changed by reading it. A new seat is checked against it (code must exist, not left;
the name is HiFive ID's); with HiFive ID unreachable the typed code stands and the log says so.

Tokens must carry `module: inventory` and `aud: hifive-inventory`. "Can access" with no seat here
gives `HFID_GRANT_ROLE` (STAFF) in the unit matching the HiFive ID entity; never Unit admin.

## 3i. Enterprise features (feature 14), each switched on per unit

Every one is off until a unit administrator switches it on (Admin, Settings, More features); a
switched-off feature's routes answer `FEATURE_OFF` and say where to switch it on, its screens
and fields hide (`when:` on SCREENS, one setting or several), and its tables stay empty. One
migration, `0010_enterprise.sql`.

| Feature | Setting | Where | The rule worth knowing |
|---|---|---|---|
| Approval limits | `limits.on`, `limits.po/writeoff/count` | `domain/limits.js` | Above the amount: a unit admin, or somebody ticked Director. Corrections and counts are judged on their differences without signs: 5 short and 5 over is 10 of difference. |
| Pack sizes | `packs.on` | `domain/packs.js` | Stock is always in the item's unit. A line written in a pack keeps `pack_label/qty/cost` beside the item quantity the engine moves. A supplier's own pack is refused for another supplier. |
| Shelf locations | `locations.on` | `item_locations` | Per item per store; count sheets and request picking sort by it. |
| Inspection | `quarantine.on` (off / flagged / all) | `domain/quality.js`, `buildRelease`, `buildHoldOut` | Held stock is `balances.on_hold` / `batches.on_hold`: owned and valued, but nothing that hands stock out reads it. Release moves no value; rejection sends it back to the supplier (returns on) or writes it off. |
| Returns to supplier | `returns.on` | `domain/quality.js` | Against an approved delivery, at most what it brought less what is already going back; four eyes; the credit expected is the delivery's price. |
| Recall tracing | `recall.on` | `domain/recall.js` | Read from the ledger by batch id. Person names only for `cost.people`. |
| Landed cost | `landed.on` | `domain/accounts.js` `spreadCharges` | Spread by value (by quantity when nothing has a price), rounding on the largest line, at posting. Stock and average cost at the landed cost; `unit_cost` stays the supplier's price for price history. |
| Equipment | `assets.on` | `domain/assets.js` | Not stock: never in the ledger. Next service = last (or purchase) + months, clamped to the month's end; a repair does not move it. |
| ABC cycle counts | `abc.on`, `abc.a/b/c_days` | `domain/abc.js` | Graded by the value used in 90 days (A to 80%, B to 95%); an item is due in a store when its last approved count there is older than its grade's days. A cycle count is an ordinary count of named items. |
| Accounts | `accounting.on`, `accounting.vat_rate` | `domain/accounts.js`, `domain/periods.js` | VAT beside the net, never in the cost. Month close: trigger `movements_period_closed` refuses any movement dated in a closed Gulf month, whatever writes it; only past months close; reopening needs a reason. |

New lines on Today, the hub and the morning email (waiting.js): held for inspection, returns to
approve, equipment past or near its service date. Two are on Today only until they are late:
a credit note (emailed once a month late) and cycle counts (once a week late), because a
routine that arrives every morning stops being read.

## 3h. Lab readiness: storage and opened packs

- Off unless the unit sets `lots.opened` to `on`: the In use screen, the item fields and the
  Today line all hide, and `POST /api/openings` refuses with `LOTS_OFF`. Nothing is lab-specific
  in code: a spa can switch it on for oils that must be used within months of opening.
- `items.storage` (ROOM, FRIDGE, FREEZER) and `items.open_life_days` are set only when a form
  sends them, so the bulk upload and a form without them never clear them.
- `src/domain/lots.js`. **Opening is a use**: an ISSUE through the stock engine (FEFO, expired
  never, doc type OPEN) in the same batch as one `lot_openings` row per batch it came from, so
  cost by department and the forecast count it like any other use. The in-use date is the
  earlier of the printed expiry and the day opened plus `open_life_days` (`useBy`, tested alone).
- Finishing or discarding (with a reason) moves no stock: it left the shelf when opened. The
  opener, or anyone with `adjust.raise`, may do it. A bench or analyser is an area in a
  department, so every opening says where a lot went; `GET /api/openings?closed=1&q=<lot>`
  traces a lot to the benches that used it.
- Today shows those past their in-use date (urgent) and those due within `lots.due_days`.

## 3g. Suggested levels (forecasting)

- `src/domain/forecast.js`. Use is what left a store's shelf for use or for another store over
  the last 90 days: ISSUE (not the shelf-free ISSUE written when held stock is used, which TAKE
  already counted), TAKE less RETURN, and TRANSFER_OUT. ADJUST and COUNT are not use.
- Daily use is the average of the 30-day and 90-day rates; an item seen in the store for fewer
  than 90 days has its longer rate taken over the days it has been there (at least 30).
  critical = use × days to restock; reorder = use × (restock + spare); top up = reorder + use ×
  days one order lasts, rounded up, reorder at least 1, top up above reorder (`suggest`, tested
  alone). Days to restock: a main store takes the item's usual supplier's delivery time, else
  `forecast.lead_days`; a sub store takes `forecast.restock_days`. Spare and cover days are
  `forecast.safety_days` and `forecast.cover_days`. All four are unit settings.
- Nothing changes by itself. `POST /api/forecast/accept` (`items.edit`, a manager) writes the
  levels a manager ticked, as suggested or changed, in one batch with one audit row, refused
  whole if any line is wrong. Seen by `items.edit` and `po.edit`. Linen, retired items and
  items not used in 90 days get no suggestion; existing levels on unused items are left alone.
- The levels are the same `item_levels` everything else reads, so What to buy follows at once;
  it also says how many items used lately have no levels yet.

## 3f. Suppliers: prices, delivery record, and orders sent to them

- `src/domain/suppliers.js`. Nothing is typed: a **price** is the unit cost on an approved
  delivery line with a price, from a recorded supplier; a supplier's **record** is the unit's
  approved orders of the last twelve months set against the approved deliveries that came. Both
  are read-only and fenced on the unit. A local purchase with no supplier is history, not a
  comparison. "Lowest" is marked only between two or more suppliers still in use.
- An order is judged one of ON_TIME, LATE, OVERDUE, WAITING, CLOSED_SHORT, NO_DATE
  (`judgeOrders`, with tests). Only the first three count as "judged" for "on time, n of m";
  an order with no expected date cannot be judged, which is why the editor asks for one.
- Prices are seen by `cost.view`, `po.edit` and `receive` (those who see or type costs); the
  record by anyone who may see orders. Comparing suppliers is not comparing people: Design
  Guide rule 5 is untouched.
- **The order's PDF** is `src/lib/pdf.js` (pdf-lib, as HiFive ID makes its letters): plain
  black on white, A4, as many pages as it needs. The built-in fonts hold Western letters only;
  anything else becomes "?" rather than failing the order.
- **Emailing it** is `src/lib/mail.js`: Microsoft Graph `sendMail` with an app's
  client-credentials token, as Recruitment and HiFive ID send. Off until `MS_TENANT_ID`,
  `MS_CLIENT_ID`, `MS_CLIENT_SECRET` and `MAIL_SENDER` are all set (`/version` bindings `mail`).
  Only an approved or partly received order, only to the supplier's own address, only when a
  person with `po.send` presses the button; a second send must be asked for (`again`). Every
  attempt, sent or failed, is a row in `po_emails` with the PDF's SHA-256, and an audit row.
  Microsoft's own error is never shown: the person gets a sentence to act on or pass on.

## 4a. The client and the HiFive design system

The client was moved onto the HiFive design system on 12 November 2026 (Design Guide Part T;
the record is `hifive-design/docs/adoption/inventory.md`).

- **Theme.** `index.html` loads the tokens and their boot script from the design system's site
  (`/theme/v1/`), with a local copy in `client/public/theme-fallback` if that site is down.
  Until a person has chosen a look, Inventory wears what every HiFive app opens in: Water,
  Soft, light (Design Guide D-005; `public/theme-defaults.js` and `src/appearance.js`).
- **Controls.** Every button, field, chip, table, sheet and tile is `@hifive/ui`. The library
  is private and has no registry, so its built files are copied into `client/vendor/hifive-ui`
  and committed (`npm run sync-ui` in `client`, after building the library in `hifive-design`).
  `client/src/ui.jsx` fits the library to how the screens ask for things (an icon by name, a
  status by its code); it has no look of its own. `client/src/styles.css` is the shell, the
  page and card frame, and a few arrangements only this app has (a list of lines, the camera).
- **Icons** are lucide, through `client/src/icons.jsx`, asked for by what they mean here.
- **The person's choice of colours and dark mode** is made in HiFive ID. The page may only talk
  to this Worker, so `GET /api/appearance` asks HiFive ID's `/me` with the person's own session
  and `client/src/appearance.js` wears the answer, at sign-in and when the tab comes back into
  view. Anything that goes wrong leaves the page as it is.
- **Shell.** A side menu on a computer (sixteen places in four groups do not fit a top bar); a
  top bar and five tabs on a phone, the fifth opening everything else.
- **Still to do** from the adoption's own audit: the app logo (a lucide icon stands in until the
  logo family has a symbol for Inventory); windows that open over another window (scanning from
  inside a sheet), which the guide does not allow; and, on the screens that were not prototyped,
  a few main buttons that are still disabled until the form is complete.

## 5. Things deliberately not done

- **No ranking of people or units** (Design Guide rule 5). Cost per person (`cost.people`:
  Manager, Unit administrator) and the group summary are in name order, and their columns cannot
  be sorted. A person sees their own under With me. Somebody who sees costs but does not manage
  people gets ledger lines for use without the name, or the ledger would be cost per person.
- **Directors are not read from HiFive ID yet.** Its directors app is not in Inventory's token,
  so a group administrator sets `staff.group_summary` on the People screen.
- **No PIN sign-in.** Everybody has HiFive ID; a second credential is a second thing to leak.
- **No replay of the old app's history into the ledger.** It sits in `legacy_movements` for
  reference; replaying it on top of the opening balances would count everything twice.
- **People are not imported.** The sheet has names, not employee codes. They are picked from
  HiFive ID's staff list instead.
- **Nobody is removed automatically.** A leaver in HiFive ID is put to an administrator; HiFive ID
  itself stops them signing in.
