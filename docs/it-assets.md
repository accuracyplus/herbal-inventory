# The IT asset register (Design Guide D-086, D-087)

Sinu, 22 Nov 2026:

- **D-086 · Asset register, IT first, separate from stock.**
  - It holds devices (the server included), SIMs (last 4 digits only) and licences (product, seats,
    holders, price, renewal; never keys), with their invoices.
  - Each asset keeps its holder history, the condition and photos at every hand-over, and a status:
    in stock, assigned, in repair, idle or retired.
  - At exit, IT clears the person: condition at issue compared with condition at return.
  - Lists and alerts cover idle items, shortages, warranties ending and licences ending.
  - IT raises purchase requests to the facility approver; HR raises new email account requests to IT.
  - Prices are seen by IT, the HR Manager and the directors only (Part Q for photos; C22).
- **D-087 · Owner Ramesh.** The first count is at Accuracy Plus, including the server and every
  Microsoft licence. It is a KPI task in Performance Hub (that chat's), with the due date left
  empty until Sinu sets it.

Decided in the Inventory chat, 22 Nov 2026 (Sinu took every recommended answer):

1. **Grow Equipment.** One register. The Equipment screen gains IT kinds; spa equipment works as before.
2. **A new unit, Accuracy Plus, with an IT role.** Ramesh holds the IT role there. Only the register
   is used in that unit, not stock.
3. **Exit clearance from HiFive ID's leaving dates.** Inventory already reads HiFive ID's staff list,
   which carries each person's leaving date, with the signed-in person's own session (lib/roster.js),
   so no HiFive ID change is needed.
4. **An HR seat in Inventory.** HR Managers raise email account requests to IT and see IT prices.

## Equipment today: every feature, all kept

| Where | Feature | After |
|---|---|---|
| Screen | Title "Equipment", subtitle; "Add equipment" for assets.edit | Kept |
| Screen | Search by number, name, serial or room | Kept (also finds holder, SIM digits, product) |
| Screen | Show: In use / Service due / Retired | Kept, for equipment |
| List | Columns Equipment (name, tag, serial, make and model), Where (room or place, department), Next service with standing pill, Warranty with Ended / Ending soon | Kept |
| List | Empty messages for each view | Kept |
| Window | Standing pill and status; tag, serial, make and model, where, supplier, bought, cost (cost.view), warranty, serviced every, last and next service, notes | Kept |
| Window | Services and repairs table: when, what, by and note, cost (cost.view), recorded by and when | Kept |
| Window | Edit; Record a service (not when retired); one window at a time | Kept |
| Service | What was done, when (not in the future), by, cost, next due (worked out from the interval; a repair does not move it), note, "It is back in use" after a repair | Kept |
| Form | What it is, asset number (upper case, unique), serial, category, make, model, room or "where, then", supplier, bought on, cost (cost.view), warranty, serviced every, last serviced, next service, status (edit only), notes | Kept |
| Server | Costs hidden without cost.view; an edit by somebody who cannot see the cost keeps it | Kept |
| Today | Equipment past or near its service date; warranties ending | Kept |
| Hub | inventory_assets_due on "Waiting for you" | Kept |
| Setting | assets.on, assets.warn_days | Kept |

## IT purchases: unit head first, then Accounts (27 Nov 2026)

Sinu, relayed by the HiFive ID chat: "IT purchase requests (SIM, phone and so on) are approved by
the facility's unit head first, then Accounts." He took the proposal in this chat ("Yes, as
proposed"):

- **Step 1, the unit head.** It is read from HiFive ID's facility contacts when they act, the
  Primary or the Secondary (lib/unitheads.js). Inventory keeps no list of unit heads. HiFive ID
  needs to let Inventory read them with a service token that sees unit heads only, like Learning
  Point's training token. That token is the `HFID_CONTACTS_TOKEN` secret.
- **Step 2, Accounts.** It is a new seat in Inventory (`ACCOUNTS`). It sees the IT register and
  what IT costs, and approves after the unit head. It is not the same person as the unit head.
- **No fallback.** Without the link, with no unit head listed, or with HiFive ID not answering,
  the first step cannot be taken, and the Requests list says why.
- **Who can act.** Nobody approves their own request. Either step can turn it down, with a
  reason. Only whoever raised it can withdraw it.
- **What a unit head needs.** To open the request in Inventory, a unit head needs Inventory
  access in HiFive ID and a seat at the facility; Viewer is enough. The hub's "Waiting for you"
  and Today tell them by employee code.
- **What it replaces.** The single "facility approver" (Manager or Unit administrator,
  `it.decide`) is gone.
- **Prices.** The unit head does not see the estimate, under the IT prices rule. Accounts does.
