# HiFive Inventory — working rules

Read `ARCHITECTURE.md` first. These are the rules a change must keep.

1. **Every stock change goes through `src/domain/stock.js`** (`buildPosting`, `buildLinenMove`)
   and is committed with `commit()` in one batch with its document rows and `auditStmt`. Never
   write `balances`, `batches` or `movements` anywhere else.
2. **Roles are decided in `resolveAuthContext` and checked with `may()` / `requireMay()`** from
   `src/domain/access.js`. Add a new ability to `RULES`; never list roles inside a handler.
3. **Every query is fenced on `user.unitId`.** Another unit's id answers 404.
4. **Refusals are `DomainError`s with a sentence a store keeper can act on** — what, how many,
   which store. Never surface a database message.
5. **Schema changes** go in a new `migrations/NNNN_name.sql` *and* a line in `src/lib/schema.js`
   `LEVELS`, so `/version` shows a Worker running ahead of its database.
6. **Client**: every control is drawn by the HiFive library (`@hifive/ui`, vendored in
   `client/vendor`), reached through `client/src/ui.jsx`. Never style a control in
   `client/src/styles.css`, which holds only the shell and layout: a control the library lacks
   is added in `hifive-design` (Design Guide Part J), then brought in with `npm run sync-ui`.
   Design tokens only (no raw hex); brand colour as text is `--primary-text`, never `--primary`;
   nothing under 12px; 44px touch targets; a section with nothing in it collapses to a `<Quiet>`
   line; a tile is never shown for zero; a table cell with nothing to say is empty, never a
   dash; a form's main button stays enabled and says what is still needed. Every custom request
   header must be in the Worker's `access-control-allow-headers` (test/auth.test.js checks
   `x-unit`).
7. **Tests** run against real SQLite and real RS256 tokens (`test/helpers/http.js`). A new rule
   gets a test that proves both the refusal and that the allowed path still works.
8. Node 22.5+ for `npm test` (uses `node:sqlite`).
