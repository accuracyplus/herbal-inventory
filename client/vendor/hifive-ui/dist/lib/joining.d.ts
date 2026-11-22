/**
 * C24 · Joining your team (approved by Group HR 21 Nov 2026). The words
 * a reporting manager's hub card uses for each person joining their team.
 *
 * The documents count only says what is known: Recruitment sends the open
 * paperwork stage and the done ones, and later stages arrive when it is their
 * turn, so there is no honest "N of M" for documents. A setup item that is
 * stuck reads "held up", never "a problem": the manager can't act on it, so
 * the card says who is on it. Same words as HiFive ID's morning line and
 * email (hifive-id 9032427).
 */
export type SetupState = 'ready' | 'arranging' | 'held';
export interface JoiningSetupItem {
    item: string;
    state: SetupState;
    /** The person arranging it, by name. */
    holder?: string | null;
    /** ISO date it was due. Shown only once it has passed and the item isn't ready. */
    due?: string | null;
}
export interface JoiningStage {
    stage: string;
    state: 'done' | 'open';
}
export interface Joiner {
    id: string;
    name: string;
    /** Not in Recruitment's hand-off yet; the row shows the facility alone until it is. */
    job?: string | null;
    facility: string;
    /** ISO date, YYYY-MM-DD. */
    joins: string;
    urgent?: boolean;
    setup: JoiningSetupItem[];
    documents: JoiningStage[];
    /** Where and when they report on day one, when Recruitment has it. */
    dayOne?: string | null;
}
/** "Mon 1 Dec". */
export declare function shortDate(iso: string): string;
/** "Joins Mon 1 Dec (in 5 days)", "Joins tomorrow", "Joins today", "Joined yesterday", "Joined 3 days ago". */
export declare function whenLine(joins: string, today?: Date): string;
export declare function isLate(item: JoiningSetupItem, today?: Date): boolean;
export declare function heldCount(j: Joiner): number;
/** "Setup 2 of 3 ready" plus "1 held up" when any is; the setup list is complete from the start, so its total is real. */
export declare function setupLine(j: Joiner): {
    line: string;
    held: string | null;
} | null;
/** "Documents 2 done · 1 in progress": only what is known, never a total. */
export declare function documentsLine(j: Joiner): string | null;
/** What a setup item says beside its name in the sheet. */
export declare function setupDetail(item: JoiningSetupItem, today?: Date): string;
/** Anyone with something held up first, then urgent, then soonest joining; ties by name. */
export declare function joinerOrder(list: Joiner[]): Joiner[];
/** The Ask HR link: who it goes to (first name, for the button) and the mailto. */
export interface AskHr {
    href: string;
    to?: string | null;
}
/** mailto with the subject "About <name>, joining <Tue 1 Dec>" and an empty body. */
export declare function askHrMailto(j: Joiner, email: string | string[]): string;
