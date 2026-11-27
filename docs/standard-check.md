# Inventory against the suite architecture standard

This is Inventory's checklist from HiFive ID's `docs/architecture-standard.md` (accuracyplus/hifive-id
467dd45, Sinu, 27 Nov 2026). The Inventory chat filled it in on 27 Nov 2026 and corrects it when
anything changes.

The guiding rule is **safety before clever; add nothing without a real problem.** A "No" below is
work still to do, in the standard's order of work, on Sinu's word. It is not a promise to build it.

| # | Check | Yes / No / Not needed, and where |
|---|---|---|
| 1 | Staff screens hold no admin controls; admin screens reachable from the console's menu | **Partly.** Admin controls sit only on Inventory's Admin screen (units, stores, rooms, people, settings, import). Only a unit administrator sees it, and the server refuses everyone else (`admin` rule, src/domain/access.js). The HiFive ID console's menu does not link to it yet. |
| 2 | No screen shows empty, zero or "all fine" when it could not check | **Yes, with one gap.** When HiFive ID is unreachable, the people review says so (people.test.js, "today: HiFive ID unreachable"). IT purchase requests say when the unit head cannot be confirmed (it-register.test.js, "no link…"). Stock in hand leaves out anybody unknown, never showing a zero. **Gap:** when HiFive ID cannot name the unit head, the hub's "Waiting for you" gives the unit head no line rather than saying it could not check. The Requests list carries the reason. |
| 3 | All email goes through HiFive ID's central sender and checks the paused list | **No.** Purchase orders go to suppliers through Inventory's own Microsoft 365 sender (src/lib/mail.js), and that sender is not set up live (/version `mail: false`), so nothing is sent today. Moving to the central sender waits on it being finished (standard, step 5). |
| 4 | Handover note exists and is current | **Partly.** docs/DEPLOY.md (set-up and deploy), docs/it-assets.md (the IT register's decisions), docs/leave-guard.md, and this file with docs/feature-register.md. There is no single handover note yet. |
| 5 | Holds no copy of a fact another app owns (list any) | **Partly.** (a) `staff` keeps each seat holder's employee code and name, so past records keep a name; the name is refreshed from HiFive ID's staff list (people review). (b) A unit's name is HiFive ID's entity name, by which it matches the facility. Leaving dates, unit heads and the staff list are read from HiFive ID when needed, never copied. |
| 6 | Status report in the standard format (version, health, open work, waiting on Sinu) | **Yes**, since 27 Nov 2026. /version gives the build, health and schema as before, plus `hifiveKeyMode`, `signingKeys`, `features` and `status`. `scripts/deploy.mjs` counts `features` from the feature register and `status` from docs/status.json, which this chat keeps. Anything not known is left out, never a 0 (src/lib/release.js, F-075). |
| 7 | Feature register exists; each feature has a test; deploy blocked on failure | **Yes**, since 27 Nov 2026. docs/feature-register.md has 75 features, each with its tests, and test/feature-register.test.js fails when a named test or place is missing. `npm run deploy` runs every test first, for the Worker (root `predeploy`) and for the Pages client (client `predeploy`). |
| 8 | Release notes list features added, changed, removed | **No.** Commit messages say what changed and why. There is no release-notes file. |
| 9 | Nightly backup; date of the last real restore test | **No.** It relies on D1 Time Travel (the account's point-in-time restore). There is no nightly export, and no restore has been tested. |
| 10 | No secrets in code; date of last rotation; no own copy of the signing key | **Yes / unknown / yes.** Secrets are Worker secrets (Microsoft 365 sender; `HFID_CONTACTS_TOKEN` when HiFive ID issues it). Sign-in is checked against HiFive ID's published keys (`HFID_JWKS_URL`), so there is no signing key here. The date of the last rotation is not recorded. |
| 11 | Retries with growing waits on calls that can fail briefly | **No.** Calls to HiFive ID and Microsoft 365 are tried once, and a failure is said in words. The only retry is a reference-number clash (src/lib/data.js). |
| 12 | Rate limits on sign-in-facing and service routes | **No.** There are no rate limits of Inventory's own. Service routes need a HiFive ID assertion or a unit's connection key. |
| 13 | Staging exists and is used before production | **No.** Changes are checked on a local copy (test/serve.mjs) with every test, then go to production. |
| 14 | Weekly dependency check runs | **No.** |
| 15 | Dates read dd-mm-yyyy; times on the Gulf clock (D-090) | **Yes**, live since 26 Nov 2026 (3672424): screens, CSVs, the order PDF, the supplier email and refusals (F-065). |
| 16 | No patient-related data | **Yes.** Stock, rooms, staff, suppliers and devices only. A service posted from another system carries its reference, the room, the person who did it and the price, never a patient. |
