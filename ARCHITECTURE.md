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

No cron trigger: the account is at the free plan's five. Alerts are computed when Today opens,
and HiFive ID's hub asks `/pending/service` itself.

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

## 4. HiFive ID

| Route | Who calls it | Guard |
|---|---|---|
| `POST /auth/hfid/exchange` | this app's page, with `?hfid_code=` | the one-time code; swapped through the `HFID` binding, app `inventory` |
| `POST /auth/hfid/arrived` | this app's page, once per sign-in | the user's token; recorded once per token digest, links `hfid_sub` |
| `POST /pending/service` | the hub's "Waiting for you" | assertion with `svc: pending`; answers for the named emp_code only |
| `GET /api/roster` | weekly reconciliation | admin/hr assertion for this audience |
| `GET/PUT /api/roles/:empId` | the HiFive ID admin console | console session (`aud`/`module` = `hifive-id`), admin/hr |

Tokens must carry `module: inventory` and `aud: hifive-inventory`. "Can access" with no seat here
gives `HFID_GRANT_ROLE` (STAFF) in the unit matching the HiFive ID entity; never Unit admin.

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
- **People are not imported.** The sheet has names, not employee codes.
