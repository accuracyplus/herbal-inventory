# HiFive Inventory

Stock, requests, purchasing, counts and linen for every HiFive unit — built the way HiFive
Recruitment and Transport are built: a Cloudflare Worker with D1 as the system of record, a
React app on Cloudflare Pages, and sign-in through HiFive ID.

It grew out of the Herbal Park inventory app (`index.html` at the root of this repo, on a Google
Sheet). **That file is untouched and still live** until the switch-over in `docs/DEPLOY.md`.

| | |
|---|---|
| `src/` | API Worker — `worker.js` routes, `lib/` sign-in and helpers, `domain/` every stock rule |
| `schema.sql` | D1 schema, with the append-only triggers on the ledger and audit log |
| `client/` | React app (Vite), on the HiFive design tokens |
| `seed/` | Herbal Park, its two stores, and the first administrator |
| `migrations/` | Schema changes after `schema.sql`, run in number order |
| `test/` | Tests against a real SQLite engine and real RS256 tokens: `npm test`. `test/serve.mjs` runs the app on this PC with throwaway data |
| `docs/DEPLOY.md` | Step-by-step go-live checklist |
| `ARCHITECTURE.md` | How it works and why |

## What it does

- **Multi-unit**: each HiFive business is a unit with its own stores, items, rooms and people;
  one person can hold different roles in several units and switch between them.
- **Stock** per store, with reorder / critical / top-up levels per store, weighted average cost,
  batches with expiry dates issued first-expiry-first (expired stock is never handed out).
- **Record use** against a room and the person who used it, with the room's department kept on
  the record (each unit chooses room, person or both); **transfers** between stores; **receive
  deliveries** against a purchase order or as a local purchase.
- **Scanning** with the phone's camera on every list of items, or **Scan with phone** from a
  computer (a QR code pairs the person's phone; scans land on the computer's list); a Scan screen
  for walking the store; unknown barcodes are saved to the item by store roles.
- **Services with recipes** (treatments, or lab tests): what each normally uses is defined once;
  recording one takes it all off the shelf together, editable first, and a report compares actual
  use with the recipe by service, item, room and (for managers) person.
- **Bookings and billing link**: a booking or billing system sends each completed service with a
  key and the stock comes off by itself, once per reference; what cannot be recorded waits with
  its reason for a manager. Until something is connected, the same list uploads as a sheet. With
  prices, a report shows charged against used for each service.
- **Lab readiness** (a unit switches it on): items say where they are kept and how long they
  last once opened; an In use screen follows each opened kit or reagent to its bench or analyser,
  with its in-use date, until it is finished or thrown away, and finds every pack of a lot.
- **More features**, each switched on per unit and off by default: approval limits by amount,
  pack sizes (buy by the carton, store by the box, use by the piece), shelf locations, holding
  deliveries for inspection, returns to supplier with their credit notes, recall tracing of a
  lot, landed cost, an equipment register with service dates, ABC cycle counts, and accounts
  (VAT on deliveries, exports for the accounts system, month close).
- **Suggested levels**: reorder, critical and top-up levels for each store worked out from the
  last 30 and 90 days of real use and how long an order takes; a manager ticks the ones to take,
  changes any number, and sets them in one go. What to buy follows them.
- **Suppliers**: what each supplier charged for every item, side by side, with the lowest marked;
  the last price paid shown while an order is written and approved; each supplier's record (on
  time, late, closed short, lines short of the note). An approved order downloads as a PDF and,
  once a Microsoft 365 mailbox is set up, is emailed to the supplier from the app.
- **Deliveries in two steps**: the receiver counts against the delivery note, a manager approves,
  then stock is on the shelf. Photos or PDFs of the note, invoice and LPO are kept with each
  delivery; a photo of the note can be read to fill the form in, each supplier's wording and pack
  sizes are remembered, and differences from the note or the order are shown to the approver.
- **Bulk upload** of items (with levels per store), suppliers, and rooms and areas from Excel or
  CSV: download the list, edit it, and a check shows what would change before anything is saved.
- **With me**: staff take stock to themselves or their room, then record it as used or return it;
  anything held too long is flagged to them and their manager, with no ranking of people.
- **Requests**: staff ask, a manager approves (or the unit switches approval off), the store gives
  out in one go or several.
- **Purchasing**: "what to buy" from levels and open orders, purchase orders from draft to
  approval to delivery, printable for the supplier; suppliers with TRN and terms.
- **Stock counts**: blind by default, counted on a phone, variances reviewed before posting.
- **Corrections** (damaged, expired, lost, found) posted only after a second person approves.
- **Linen**: every piece is clean on the shelf, in a room, or at the laundry.
- **Today** screen per person, **reports** (usage and cost by room, department, category and,
  for managers, person; value, expiry, movements, variances, slow-moving, purchases) with CSV, a
  **monthly summary across units** for directors, an **activity log**, and a one-time **import** of the old app.
- HiFive ID integration: sign-in, people picked from HiFive ID's staff list with joiners and
  leavers put to an administrator (never removed automatically), "Can access" grants, the hub's
  "Waiting for you" and the combined morning email (both the same list as Today), each person's
  stock in hand for their HiFive ID profile, the weekly
  roster reconciliation and the admin console's role dropdown.
