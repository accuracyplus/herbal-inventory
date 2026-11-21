# The HiFive corner button and the leave guard in Inventory

Sinu, 20 Nov 2026 (suite standard, Design Guide C21 with D-053 and D-060 to D-062): every app keeps
the way back to HiFive and asks before leaving unsaved work. Asked for Inventory on 21 Nov 2026:
"Add the shared HiFive corner button to Inventory, the same one Performance Hub and Recruitment
load ... Register every form with unsaved changes so the button asks before leaving, and keeps
asking after a save the server refused until the save works. List Inventory's current features
first and confirm none change."

## 1. Inventory's features before this change, and after

Nothing below is removed, moved or changed in what it does. The only difference anywhere is the
question "You have changes that are not saved. Leave this page and lose them?" (in Malayalam when
the screen is in Malayalam), asked before leaving a screen with unsaved work, and its twin "...
Close this window and lose them?" before closing a window with unsaved work (section 5).

**The frame (every screen):** side menu from 1024px with groups and waiting-count badges; phone bar
(four screens for the role) and More below 1024px; unit switch; your menu (More screens, language
English/Malayalam, Switch unit, Show me around again, All HiFive apps, Colours and dark mode in
HiFive ID, Sign out); "A new version is ready" with Reload; the walkthrough; the legal footer; sign
in through HiFive ID; a screen that fails to draw keeps the frame and a way back. **Kept.**

| Screen | What it does today | After |
|---|---|---|
| Today | Waiting on you, short now, expiring soon, with you now, at the laundry, today so far, your requests this week, stock value, use this month | Kept |
| Stock | Search, store and category filters, All/Short/Expiring/Linen, sortable table, CSV, New item; item window (balances, batches, levels, recent movements, Request, Record use, Edit); item editor (codes, barcode, packs, levels per store, shelf location, storage, open life) | Kept |
| Record use | Store, room buttons up to 12, used by, usual items, item picker, scan and scan with a phone, note, purpose, Record use, Record another | Kept |
| Services (treatments) | Record a treatment from its recipe (what it used, differences), recorded lately; recipes; from bookings or billing (sheet upload, waiting list, connections and keys) | Kept |
| Scan | Scan walk, scanning for your computer, hand items to another screen | Kept |
| With me | What you hold, take stock, used/returned (settle), what I used and its cost | Kept |
| In use | Open a pack, packs opened, finish or discard | Kept |
| Linen | Balances per store, move pieces (out, wash, back, lost), recent movements | Kept |
| Requests | New request (ask, needed in, how soon, fill from levels), request window: approve, give out, cancel, close | Kept |
| Receive | Against an order or local, note number and date, invoice, VAT, charges, read the note from a photo, paperwork, what arrived, Record another | Kept |
| Transfer | From, to, items, note | Kept |
| Purchasing | Orders (draft, submit, approve, send, email, PDF, receive), deliveries (approve, send back, paperwork), suppliers (details, prices, how their orders went), what to buy, suggested levels | Kept |
| Stock counts | Start a count (whole store or category), blind counts, save progress, submit, approve, cycle counts by grade | Kept |
| Corrections | New correction (store, reason, lines), approve or withdraw | Kept |
| Equipment | List by due, equipment window, add/edit, record a service | Kept |
| Returns and inspection | Inspection holds, release or reject, returns against a delivery, credit notes | Kept |
| Reports | Every report (on hand, by item, room, person, department, category, store, supplier, movements, day by day, price and margin, corrections, count differences, old app history), CSV, PPT | Kept |
| Trace a lot | Find a lot, where it went, with people, opened packs | Kept |
| Accounts | Exports, month close, reopen | Kept |
| Admin | Items, stores, rooms, departments, people (from HiFive ID), units, settings and More features, bulk upload, old-app import, audit | Kept |
| Help | Help, who may do what, your access | Kept |

## 2. What is added

- **The corner button**, the one script every HiFive app loads
  (`https://hifive-id-portal.pages.dev/hub-button.js`, in `client/index.html`). From 1024px it sits
  at the bottom left; the side menu now ends 60px higher, so your name and menu stay clear of it.
  Below 1024px it stays hidden, because Inventory shows its phone bar there and the button would
  cover the first tab. On a phone, More → "All HiFive apps" is the way back, as before.
- **The security header** (`client/public/_headers`) allows that one file, not the whole HiFive ID
  site. The script calls nothing outside the page, so nothing else changes.
- **The question before leaving**, from these: the side menu, the phone bar, More, Back or Forward
  to another screen, any button that moves to another screen, Switch unit, Sign out, Reload,
  "All HiFive apps", "Colours and dark mode", the corner button, and closing or reloading the tab
  (there the browser asks in its own words).

## 3. What counts as unsaved

- **Every window** (`<Sheet>` in `src/ui.jsx`) is marked: anything typed or chosen in it counts
  until it closes or a save from it works. Four windows are not marked, because they only offer
  choices that act at once: your menu, the unit switch, the welcome, and the scanner opened from a
  page.
- **The forms on a page:** Record use, Transfer, Receive, Take stock, a delivery (its note), record
  a treatment, Admin settings, the old-app import, suggested levels, month close, and the three
  bookings parts (waiting, from a sheet, connections).
- **Lines added by a tap or a scan** (the usual items, the room's list, the scanner): once the
  person has changed an item list, it counts while it has lines (`src/lines.jsx`).
- **Bulk upload:** a chosen file counts until it is saved.
- **Never counted:** search boxes, the item picker's search (an item it adds counts), the store
  picker on suggested levels, every filter on a page.

## 4. A refused save keeps asking; a save that works stops (D-061, D-062)

Inventory saves with buttons, and many windows stay open after a save (a request just approved, a
count's progress). `src/leave.js` notes the button pressed and the window or form it is in. When a
write that starts within four seconds comes back accepted, `src/api.js` marks that window or form
saved. A refusal marks nothing, so the work keeps counting until a save works. Writes that change
nothing never mark anything: a check before saving (`dryRun`), reading a delivery note, the price
guide, the scanner, your own settings. The page root carries `data-hf-keep-on-submit`, so the one
real form submit is treated the same way.

## 5. Closing a window asks too (Sinu, 21 Nov 2026: "Ask on window close")

- A window with unsaved work asks "You have changes that are not saved. Close this window and lose
  them?" (in Malayalam on a Malayalam screen) before it closes by its X, Escape, a tap outside it,
  its Cancel (`<CancelButton>`, all 17 Cancels), or Back from an item, request, order, count,
  correction, return or equipment window. "Stay" keeps the window and what was typed. The
  scanner's Done closes only the scanner, so it does not ask.
- A window with nothing changed, or after a save from it worked, closes without a word.
- Each window asks only about its own work: `src/leave.js` notes what was typed in each guarded
  element, by the script's own rules. A "yes" drops that window's work only, and the X followed by
  the address change does not ask twice. This check is Inventory's own, so it asks even when
  HiFive ID is unreachable.

**Unchanged on purpose:** moving within a screen asks nothing when no window is open: a tab of the
same screen (Purchasing's sections, the Services sections, Returns' tabs) or the store picker on
suggested levels. Without the HiFive script, leaving a screen asks nothing, as before.

## 6. Checked

- `test/leave.test.js`: 11 tests. All 303 tests pass.
- Local copy, served with the same CSP as a meta tag, with real typing and clicks; only the
  browser's own confirm was stubbed, to answer it and record the words:
  - The script loads under the CSP.
  - At 1280px the button shows clear of the menu; at 1000px and on a phone it is hidden.
  - Record use, with a typed search and an item added: the side menu asks; "stay" keeps the screen
    and the lines. Back asks too, and "stay" puts the address back.
  - A refused save (the server's answer replaced with a refusal) shows the error and still counts.
    The real save then works, the Done view shows, nothing counts, and moving on asks nothing.
  - Searching Stock does not count.
  - In the New item window, after typing a name: Back asks, and so does the corner button.
    Saving closes the window, and nothing counts.
  - A count window after "Save progress" stays open and nothing counts.
  - On a phone in Malayalam, the phone bar asks in Malayalam; "leave" goes on and asks only once.
  - Window close (in Malayalam): an untouched New item window closes on Escape without a word.
    With a name typed, Escape, a tap outside and the X each asked, and "stay" kept the window and
    the name. Cancel with "close" asked once and closed, and the move to Requests afterwards asked
    nothing. In a request window with a typed note, Back asked, and "stay" kept the window, the
    note and the address. The X with "close" asked once, closed, and the address change did not
    ask again. Approving with a note kept the window open, and Escape then closed it without
    asking.
