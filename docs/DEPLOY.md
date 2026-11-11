# Going live — checklist

Grouped by where each step is done. Do them in order.

## A. On your PC (PowerShell)

1. Get the code and check it:

```powershell
cd C:\GitHub
git clone https://github.com/accuracyplus/herbal-inventory.git hifive-inventory
cd hifive-inventory
git checkout hifive-inventory
npm install
npm test
```

2. Create the database, then paste the `database_id` it prints into `wrangler.toml`
   (replace `PASTE-THE-DATABASE-ID-HERE`):

```powershell
npx wrangler d1 create hifive-inventory
```

3. Create the tables and seed Herbal Park with you as administrator:

```powershell
npm run migrate
npx wrangler d1 execute hifive-inventory --remote --file=migrations/0001_departments_and_people.sql
npm run seed
```

   Every later file in `migrations/` is run the same way, in number order. `/version` names any
   that are missing.

4. Deploy the Worker and check it answers:

```powershell
npm run deploy
curl https://hifive-inventory.sinusuresh.workers.dev/version
```

   `"ok": true` and `"schema": { "ok": true }` means it is ready.

5. Deploy the app:

```powershell
cd client
npm install
npm run deploy
```

   It goes to `https://hifive-inventory.pages.dev`.

## B. HiFive ID (paste into your HiFive ID coding session)

```text
Register a new HiFive module: Inventory.

- App key "inventory". Tokens for it carry module "inventory" and audience "hifive-inventory",
  issuer "hifive-id", with emp_code, name, role and entity claims — the same shape as Transport.
- Allowed redirect: https://hifive-inventory.pages.dev/ (and http://localhost:5173/ for dev).
- /login?app=inventory&provider=microsoft|google must work, and the one-time hand-off code must
  be swappable at POST /token/exchange with { code, app: "inventory" }, as for Transport.
- "Can access" for Inventory: grant it to APML131 now; others as units go live.
- Hub tile: "Inventory", icon box/stock, URL https://hifive-inventory.pages.dev.
- Hub health check: https://hifive-inventory.sinusuresh.workers.dev/version
- "Waiting for you": POST https://hifive-inventory.sinusuresh.workers.dev/pending/service with a
  service assertion { svc: "pending", emp_code, aud: "hifive-inventory" } — same contract as
  Transport's /pending/service; it returns { items: [{ text, days }] }.
- Weekly reconciliation: GET /api/roster on the same Worker, admin/hr assertion, same shape as
  Transport's.
- Admin console role dropdown: GET/PUT /api/roles/:empId on the same Worker, same contract as
  Transport's. Roles offered: STAFF, STOREKEEPER, PURCHASER, MANAGER, VIEWER.
Check the Worker origin hifive-inventory.sinusuresh.workers.dev is allowed wherever Transport's is.
```

## C. In the Inventory app (signed in as yourself)

1. **Admin → Stores**: check "Main store" and "Spa store"; rename or add any others.
2. **Admin → Departments**: add them (Spa, Front office). **Admin → Rooms & areas**: the import
   adds the old app's rooms; add any missing and give each its department.
3. **Admin → Import**: open the old app's data link shown there, save the page, choose the file,
   and press **Check first** only. Read the report and fix anything it lists in the old app.
   The real import is step D2.
4. **Admin → People**: add each person with their HiFive ID employee code and role. The import
   report lists the names the old app knew.
5. **Purchasing → Suppliers**: add the suppliers.
6. **Admin → Settings**: decide whether requests need a manager's approval at Herbal Park, and
   whether use is recorded against the room, the person, or both (both unless you change it).

## D. Switch-over

1. Pick a quiet evening. Ask staff to stop using the old app.
2. **Admin → Import → Import now** with a fresh copy of the old app's data. It runs once only.
3. Compare **Stock** with the old app, item by item, for the main store and the spa store.
4. **Stock → item → Edit** for each oil and medicine: tick *Track batches and expiry dates*, set
   its usual supplier, and set the spa store's reorder and top-up levels. Stock already on the
   shelf shows as "no date" until the first count or delivery puts real dates in.
5. Tell staff: open `hifive-inventory.pages.dev`, sign in with HiFive ID, add it to the home screen.
6. Leave the old Google Sheet as read-only for a month, then archive it.
