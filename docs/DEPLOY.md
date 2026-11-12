# Going live — checklist

Grouped by where each step is done. Do them in order.

## A. On your PC (PowerShell)

1. Get the code and check it. The tests need Node 22.5 or newer (`node --version`); they run on
   Node's own SQLite, the same engine D1 is.

```powershell
cd C:\GitHub
git clone https://github.com/accuracyplus/herbal-inventory.git hifive-inventory
cd hifive-inventory
git checkout hifive-inventory
npm install
npm test
```

2. Create the database, then paste the `database_id` it prints into `wrangler.toml`
   (replace `PASTE-THE-DATABASE-ID-HERE`) and commit it. If wrangler offers to add it to the
   configuration on your behalf, answer **no**: it adds a second block instead of filling the
   one that is there.

```powershell
npx wrangler d1 create hifive-inventory
```

3. Create the tables and seed Herbal Park with you as administrator. On a new, empty database,
   one command runs all of it in order (schema.sql, every migration, the seed) and stops at the
   first failure, naming the file:

```powershell
npm run setup:db
```

   It is the same as these, one at a time:

```powershell
npm run migrate
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0001_departments_and_people.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0002_custody.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0003_group_summary.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0004_scanning.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0005_deliveries.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0006_services.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0007_service_link.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0008_supplier_depth.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0009_lab_lots.sql
npx wrangler d1 execute hifive-inventory --remote --yes --file=migrations/0010_enterprise.sql
npm run seed
```

   Every later file in `migrations/` is run the same way, in number order. `/version` names any
   that are missing.

4. Create the private file store for delivery notes, invoices and LPOs. Once only, and before
   the deploy, which fails without it. (On 12 Nov 2026 it already existed on the account; if
   wrangler says it already exists, carry on.)

```powershell
npx wrangler r2 bucket create hifive-inventory-files
```

5. Deploy the Worker and check it answers. `npm run deploy` runs the tests first, refuses if
   anything is uncommitted, and stamps the commit into `/version`:

```powershell
npm run deploy
curl https://hifive-inventory.sinusuresh.workers.dev/version
```

   `"ok": true` and `"schema": { "ok": true }` means it is ready; `"schema"` lists any migration
   file not yet run. `"build": { "commit": … }` is the commit now live. `"bindings"` should read
   `files: true, ai: true, hfid: true`; a `false` there is a block missing from `wrangler.toml`.
   `mail` stays `false` until step 5a is done, and that is fine: everything else works.

5a. **Optional: emailing approved orders to suppliers.** Without it, the order's PDF button
   still works and the buyer attaches it to their own email. To send from the app, it needs a
   Microsoft 365 app registration with the application permission **Mail.Send**, admin
   consented, and one mailbox to send from (a shared mailbox such as purchasing@ is best). It
   can be the app Recruitment or HiFive ID already uses, if that app may send from this mailbox.
   Put the mailbox in `wrangler.toml` under `[vars]` as `MAIL_SENDER = "purchasing@…"`, then:

```powershell
npx wrangler secret put MS_TENANT_ID
npx wrangler secret put MS_CLIENT_ID
npx wrangler secret put MS_CLIENT_SECRET
npm run deploy
curl https://hifive-inventory.sinusuresh.workers.dev/version
```

   `"mail": true` under `"bindings"` means the button appears. The first real send is the test:
   email one approved order to yourself by setting your own address on a test supplier. An
   application access policy that limits the app to that one mailbox is worth adding in
   Exchange, so the secret cannot send as anybody else.

6. Create the app's Pages project, once, with `main` as its production branch:

```powershell
cd client
npm install
npx wrangler pages project create hifive-inventory --production-branch main
```

   Then deploy it, now and after every change to the app:

```powershell
npm run deploy
```

   It goes to `https://hifive-inventory.pages.dev`. The script deploys as branch `main` on
   purpose: this repository's branch is `hifive-inventory`, and Pages treats any branch other
   than the production one as a preview, so a plain deploy from here would never go live.
   Always use `npm run deploy` here, never a bare `wrangler pages deploy`: without
   `--project-name` it has published over another app's site before.

## B. HiFive ID (paste into your HiFive ID coding session)

```text
Register a new HiFive module: Inventory.

- App key "inventory". Tokens for it carry module "inventory" and audience "hifive-inventory",
  issuer "hifive-id", with emp_code, name, role and entity claims — the same shape as Transport.
- Allowed redirect: https://hifive-inventory.pages.dev/ (and http://localhost:5173/ for dev).
- /login?app=inventory&provider=microsoft|google must work, and the one-time hand-off code must
  be swappable at POST /token/exchange with { code, app: "inventory" }, as for Transport. Set
  "handoff": "code" on the inventory entry in APPS_JSON from the start: Inventory's Worker swaps
  the code through its HFID service binding (POST /auth/hfid/exchange), so it never needs the
  ?hfid_token path that is switched off on 23 Nov.
- "Can access" for Inventory: grant it to APML131 now; others as units go live.
- Hub tile: "Inventory", icon box/stock, URL https://hifive-inventory.pages.dev.
- Hub health check: https://hifive-inventory.sinusuresh.workers.dev/version
- "Waiting for you" and the morning email: see the second block below (B2).
- Weekly reconciliation: GET /api/roster on the same Worker, admin/hr assertion, same shape as
  Transport's.
- Inventory reads GET /roster?app=inventory with the signed-in administrator's own Inventory
  token (as Transport's People screen does). No service token is needed: Inventory has no
  scheduled job.
- Admin console role dropdown: GET/PUT /api/roles/:empId on the same Worker, same contract as
  Transport's. Roles offered: STAFF, STOREKEEPER, PURCHASER, MANAGER, VIEWER.
Check the Worker origin hifive-inventory.sinusuresh.workers.dev is allowed wherever Transport's is.
```

### B2. Suite links: hub, morning email, profile (paste after Inventory's Worker is deployed)

The service binding below names the `hifive-inventory` Worker, so HiFive ID's deploy fails until
step A5 has run. The morning email switch starts **off**: switch it on in the console once a few
days of previews read right.

```text
Inventory now answers HiFive ID the way Performance and Recruitment do. Please wire it in.
Nothing in Inventory needs changing for this; every route below is live on its Worker.

1. wrangler.toml: a service binding (same zone, so a plain fetch would be refused with 1042):
     [[services]]
     binding = "SVC_INVENTORY"
     service = "hifive-inventory"

2. pending.ts TARGETS, for the hub's "Waiting for you":
     inventory: { path: 'https://hifive-inventory.sinusuresh.workers.dev/pending/service',
                  binding: 'SVC_INVENTORY', label: 'Inventory' }
   Same svc 'pending' assertion as today. Answer: { items: [PendingItem] }, with kind, text,
   detail (the unit's name), days, due (only 'overdue', on held stock and opened packs), href
   (a path, "/#/requests?status=PENDING&unit=u-hp") and action. No quick types.

3. digest.ts, for the combined morning email:
   SOURCES: { app: 'inventory', label: 'Inventory', binding: 'SVC_INVENTORY',
              path: 'https://hifive-inventory.sinusuresh.workers.dev/pending/service/all' }
   SWITCHES: { key: 'inventory', label: 'Inventory', on: false,
     detail: 'Requests, orders, deliveries, corrections and counts to approve; stock held too long; opened packs past their date. Off until previews have been read.' }
   Same svc 'pending-all' assertion. Answer: { people: [{ emp_code, name, items: [DigestItem] }] },
   each person once, nobody with nothing. No email field: match on emp_code (Inventory holds
   no addresses). Every item has a day: undated ones stay in the app, since bucketOf files an
   undated item under "due today" every morning. Items carry no `group`; switchOf maps them to
   the one 'inventory' switch. APP_TONE: give it a pastel of its own if wanted, otherwise it
   falls back to the teal 'other' tone. snapshot.ts then counts it on unit and person pages by
   the same switch, so it stays off those pages while the switch is off.

4. jwt.ts, two new verbs, modelled on monthAssertion / monthAllAssertion:
     accountabilityAssertion(env, app, empCode): svc 'accountability', role 'employee',
       emp_code = the person, sub 'service:accountability:<code>', 60 s.
     accountabilityAllAssertion(env, app): svc 'accountability-all', role 'hr', emp_code null,
       sub 'service:accountability-all', 60 s. Only if you want a nightly copy (point 6).
   Inventory refuses each route to any other verb.

5. The person page (routes/units.ts GET /person/:code) and the person's own profile on /hub:
   after the existing canView check, POST
     https://hifive-inventory.sinusuresh.workers.dev/accountability/service
   through SVC_INVENTORY with accountabilityAssertion for that person, 5 s timeout. Answer:
     { person: null }  Inventory does not know them: leave the row off, never show 0.
     { person: { emp_code, name, holding, unaccounted, since,
                 units: [{ unit, holding, unaccounted, since, hours, href }] } }
   holding = lines of stock they have taken and not yet recorded as used or returned;
   unaccounted = those held past the unit's window (`hours`, 24 unless the unit changed it);
   since = the day (YYYY-MM-DD) the oldest unaccounted line was taken. Counts and dates only:
   no item names, no money.
   Show one "Stock in hand" line, for example "Holding 3 items, 1 to account for since 3 Nov",
   or "Nothing held" when holding is 0. A timeout or error says "Inventory did not answer",
   never 0. Link with the unit's href (into the person's With me screen) only when the viewer IS
   the person; managers see the team in Inventory itself, behind its own roles.
   Who may open someone's person page stays exactly as visibility.ts decides; nothing new.

6. Optional, only if unit pages should count people holding stock past the window:
   POST /accountability/service/all with accountabilityAllAssertion from the nightly snapshot.
   Answer: { people: [same shape as above] }, everyone with a seat, holding 0 included. Part A
   rule 5 applies (under 5 people, counts only).

Tests worth adding on your side: person null leaves the row off; a timeout reads as "did not
answer", not 0; the morning email's unknownGroups stays empty with Inventory on.
```

## C. In the Inventory app (signed in as yourself)

1. **Admin → Stores**: check "Main store" and "Spa store"; rename or add any others.
2. **Admin → Departments**: add them (Spa, Front office). **Admin → Rooms & areas**: the import
   adds the old app's rooms; add any missing and give each its department.
3. **Admin → Import**: open the old app's data link shown there, save the page, choose the file,
   and press **Check first** only. Read the report and fix anything it lists in the old app.
   The real import is step D2.
4. **Admin → People**: Add a person, pick them from HiFive ID's staff list, and give them a role.
   The import report lists the names the old app knew.
   For each director: a Viewer seat, and tick **Director** so they see the group monthly summary.
5. **Purchasing → Suppliers**: add the suppliers, or **Admin → Bulk upload → Suppliers** to load
   them from a sheet. Give each one its email address if orders are to be emailed, and its usual
   delivery time. Prices and each supplier's delivery record build up by themselves from
   approved deliveries; give each order an expected date, or it cannot be judged for time.
   The bulk upload also loads new items, levels and rooms; after the import (D2) it is the quick
   way to set barcodes, suppliers and levels for many items at once.
6. **Admin → Settings**: decide whether requests need a manager's approval at Herbal Park, and
   whether use is recorded against the room, the person, or both (both unless you change it), and
   after how many hours taken stock counts as unaccounted for (24 unless you change it).
   Deliveries: whether a manager approves each one before it is on the shelf, whether the
   delivery note must be attached first, and whether notes are read from a photo (all on unless
   you change them).
   Also there: the unit's word for its services (Treatments at Herbal Park), and four numbers
   for suggested levels: days a delivery takes when the supplier has none set (7), days to
   restock a sub store (2), days of use kept to spare (3), and days one order should last (14).
   **Opened packs and storage** stays off at Herbal Park. For a laboratory unit: switch it on,
   add each bench and analyser under Rooms and areas (in its department), and give each reagent
   and kit its storage and days usable once opened on the item.
   **More features** (all off; switch on only what the unit uses): approval limits by amount,
   pack sizes, shelf locations, holding deliveries for inspection, returns to supplier, recall
   tracing, landed cost, the equipment register, ABC cycle counts, and accounts (VAT, exports,
   month close). Herbal Park can leave them all off. For a laboratory, inspection ("Only items
   marked inspect on arrival", then tick it on each reagent), returns and recall are the ones
   ISO 15189 asks for. With approval limits on, tick **Director** on People for whoever approves
   above a manager's amount.
7. **Treatments → Recipes**: add each treatment with what one normally uses. Part of a bottle is a
   decimal, so check each oil's unit first: an item counted in bottles takes 0.25 for a quarter.
   Add the usual price if the margin report is wanted.
   **Treatments → From bookings or billing**: nothing to do until a booking or billing system is
   to send treatments by itself. Then make a key there (it is shown once; give it to whoever
   sets up the other system, never by chat or email in the clear) and send them the example on
   the same card. Until then the sheet on that page does the same job by upload.
8. **Receive**, on a phone: photograph one real delivery note and check what it reads. Reading
   was proven on a printed sample only; a creased or handwritten note has not been tried.

## D. Switch-over

1. Pick a quiet evening. Ask staff to stop using the old app.
2. **Admin → Import → Import now** with a fresh copy of the old app's data. It runs once only.
3. Compare **Stock** with the old app, item by item, for the main store and the spa store.
4. **Stock → item → Edit** for each oil and medicine: tick *Track batches and expiry dates*, set
   its usual supplier, and set the spa store's reorder and top-up levels. Stock already on the
   shelf shows as "no date" until the first count or delivery puts real dates in.
5. Tell staff: open `hifive-inventory.pages.dev`, sign in with HiFive ID, add it to the home screen.
6. Leave the old Google Sheet as read-only for a month, then archive it.
7. After a month of real use, **Purchasing → Suggested levels** for each store: compare what
   real use suggests with the levels set by hand at switch-over, and take the ones that look
   right. Do it again every few months, or when a season changes. Imported history counts only
   if the import brought movements with their real dates; until a store has a month of its own
   use, suggestions are marked "Little history".

## E. Later: another unit (an Accuracy Plus lab department)

Nothing in the code is Herbal Park's; a lab is configuration.

1. **Admin → Units** (a group administrator): add the unit. Its name must be spelled exactly as
   HiFive ID spells the entity, because that is how a first sign-in finds its unit. Give it a
   short code for references (LAB-PO-0001). Add its stores.
2. In HiFive ID, grant "Can access" for Inventory to its people (they arrive as Staff), or add
   them under **Admin → People** with their roles.
3. Switch to the unit, then **Admin → Settings**: "What this unit calls its services" to Tests;
   **Opened packs and storage** on; under More features, usually inspection ("Only items marked
   inspect on arrival"), returns to supplier, recall tracing and the equipment register; ABC
   cycle counts and accounts if they are wanted there.
4. **Departments** (Haematology, Biochemistry), then **Rooms and areas**: each bench and
   analyser in its department. **Bulk upload** loads the items from their Excel sheet; tick
   "Track batches and expiry dates" and "Inspect on arrival" on reagents and kits.
5. **Services** (the unit calls them Tests): each test with what one run normally uses.
6. If the morning email should cover the lab, nothing more is needed: HiFive ID asks Inventory
   once for everybody, across every unit.
