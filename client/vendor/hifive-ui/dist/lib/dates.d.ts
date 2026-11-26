/**
 * Dates read dd-mm-yyyy, always (Design Guide D-090, Group HR 24 Nov 2026: "date in dd-mm-yyyy
 * format always", and "no, always dd-mm-yyyy" for spreadsheet exports too). One helper for the
 * suite: every app shows a date through dmy(), never its own words. Words may follow a date
 * ("01-12-2026 (in 5 days)"), never replace it. Times stay 24-hour.
 */
/** A calendar day. A plain date or an unzoned timestamp ("2026-11-24", "2026-11-24 08:00:00") is the
 *  day as written. A timestamp with its zone ("2026-11-24T23:30:00Z") is an instant, so it shows on the
 *  reader's own day (25-11-2026 in the UAE), as Recruitment found with its UTC timestamps (26 Nov 2026).
 *  A Date gives its local day. */
export declare function dayOf(input: string | Date | null | undefined): Date | null;
/** "24-11-2026"; "" when there is no date. */
export declare function dmy(input: string | Date | null | undefined): string;
/** "24-11-2026 15:30" (24-hour). A string keeps the time it was written with; a Date uses local time. */
export declare function dmyTime(input: string | Date | null | undefined): string;
/** Whole days from today to the date: 0 today, 1 tomorrow, -1 yesterday; null without a date. */
export declare function daysFrom(input: string | Date | null | undefined, today?: Date): number | null;
