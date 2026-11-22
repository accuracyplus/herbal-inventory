/**
 * Ask before leaving unsaved work: a suite standard (Sinu, 20 Nov 2026: "if any form is open or
 * they are filling in some details, ask before moving out of the page, let this be universal
 * standard"; Design Guide C21).
 *
 * The same guard as HiFive ID's corner button (hub-button.js, portal 139f6b6), built into the
 * library for apps that do not load that script (Inventory, Reach, an app whose security settings
 * block outside scripts). When the corner button has already installed `window.HiFiveSuite`, this
 * uses it and adds nothing, so a page never has two guards.
 *
 * Something is unsaved while any of these holds:
 * - an element marked `data-hf-guard` (a form, an edit drawer, an editing sheet) has had a person
 *   type or choose something in it, and is still on the page;
 * - an element carries `data-hf-unsaved="true"`;
 * - the app called `setUnsaved('<name>', true)` and has not set it back.
 * It stops counting when the element leaves the page, a form inside it is submitted, or the app
 * calls `saved(element)`. A field that saves itself (a filter) is marked `data-hf-no-guard`.
 *
 * A save the server refuses (20 Nov 2026, found in Logistics): clearing on submit forgets the work
 * before anyone knows whether it was kept, so a refused save leaves the typing on screen and
 * unguarded. Put `data-hf-keep-on-submit` on the form, on its guarded element or on the page root,
 * and a submit there clears nothing: the work counts until the app calls `saved(element)` once the
 * save has worked, or the element leaves the page. Without the mark, submit still clears, as before.
 */
export interface LeaveGuard {
    setUnsaved: (name: string, on: boolean) => void;
    saved: (el: Element | null | undefined) => void;
    isUnsaved: () => boolean;
    /** True when nothing is unsaved or the person chose to leave; false when they chose to stay. */
    confirmLeave: (message?: string) => boolean;
}
/** Where a submit clears nothing: the app says when the save worked (see above). */
export declare const KEEP_ON_SUBMIT = "[data-hf-keep-on-submit]";
/** Whether submitting from this element ends its unsaved work at once. */
export declare function submitClears(target: unknown): boolean;
export declare const LEAVE_WORDS = "You have changes that are not saved. Leave this page and lose them?";
/** Whether an edit event counts as a person changing something. */
export declare function countsAsEdit(type: string, trusted: boolean, tagName: string, inputType?: string): boolean;
type Win = Window & {
    HiFiveSuite?: LeaveGuard & Record<string, unknown>;
};
/**
 * Install the guard on this page once and return it. With the corner button loaded, its guard is
 * returned instead. Safe to call from every component that needs it.
 */
export declare function installLeaveGuard(win?: Win | undefined): LeaveGuard | null;
export {};
