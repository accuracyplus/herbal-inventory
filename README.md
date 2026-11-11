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
- HiFive ID integration: sign-in, "Can access" grants, the hub's "Waiting for you", the weekly
  roster reconciliation and the admin console's role dropdown.
