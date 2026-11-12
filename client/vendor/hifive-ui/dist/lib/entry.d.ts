/**
 * The rules behind the entry pieces (picker, quantity field) that can be checked
 * without a browser: which options match what was typed, and what one step up or
 * down from a typed quantity is.
 */
export interface PickOption {
    value: string;
    label: string;
    /** Words that also find it: a category, another name. Never shown. */
    keywords?: string;
    /** Exact codes that find it alone: an item code, a barcode, an employee code. */
    codes?: readonly string[];
}
/**
 * What matches the typed text. An exact code wins outright, so a scanned barcode
 * never offers a list; otherwise every typed word must appear in the label or the
 * keywords. With nothing typed, the first `limit` options are offered as they come.
 */
export declare function matchOptions<T extends PickOption>(options: readonly T[], query: string, limit?: number): T[];
/**
 * One step down or up from what is typed, as text. Never below `min`, never above
 * `max`. A part quantity keeps its part (0.25 goes to 1.25), and the result carries
 * no rounding noise (0.1 + 0.2 is 0.3).
 */
export declare function stepQuantity(value: string | number | null | undefined, by: 1 | -1, opts?: {
    min?: number;
    max?: number;
    step?: number;
}): string;
