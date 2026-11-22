/**
 * The phone line (Design Guide D-056, accepted 15 Nov 2026, Sinu: "Proceed"): at 900px wide
 * and under a screen is laid out for a phone. At most two short rows of controls above the
 * content; extra filters in a Filters sheet with a count; secondary actions in a More sheet;
 * lists of records as cards; long side panels folded to one line each; nothing removed.
 */
export declare const PHONE_MAX = 900;
export declare const PHONE_QUERY = "(max-width: 900px)";
/** "Filters" or "Filters, 2 on": what the button says aloud. */
export declare function filtersWords(count: number, label?: string): string;
/** The choices a phone's "Sort by" offers: every column that sorts, by its label. */
export declare function sortChoices(columns: readonly {
    key: string;
    label: string;
    sortable: boolean;
}[]): {
    key: string;
    label: string;
}[];
/** The Filters sheet's main button: "Show 12 people", "Show 1 person"; "Close" when nothing matches. */
export declare function showWords(shown: number | undefined, noun?: [string, string]): string;
