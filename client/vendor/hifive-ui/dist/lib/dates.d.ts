/**
 * Dates read dd-mm-yyyy, always (Design Guide D-090, Group HR 24 Nov 2026: "date in dd-mm-yyyy
 * format always", and "no, always dd-mm-yyyy" for spreadsheet exports too). One helper for the
 * suite: every app shows a date through dmy(), never its own words. Words may follow a date
 * ("01-12-2026 (in 5 days)"), never replace it. Times stay 24-hour.
 *
 * The suite's day is the Gulf day (UTC+4, no daylight saving). A moment in time, meaning a Date or a
 * timestamp that names its zone ("…T23:30:00Z"), is shown on the Gulf day and clock, whatever the
 * viewer's or the server's own clock says. A Worker runs on UTC, and after 20:00 UTC the Gulf date
 * has already rolled. Logistics found it first (client/src/gst.js, 16 Sep 2026); Recruitment and
 * Logistics raised it here on 26 Nov 2026. A plain calendar date ("2026-11-24") or a timestamp
 * without a zone ("2026-11-24 08:00:00") is read as written, never shifted.
 */
/** The calendar day (local midnight of that day's numbers), or null. Moments use the Gulf day. */
export declare function dayOf(input: string | Date | null | undefined): Date | null;
/** "24-11-2026"; "" when there is no date. */
export declare function dmy(input: string | Date | null | undefined): string;
/** "24-11-2026 15:30" (24-hour, Gulf clock for a moment; as written for an unzoned timestamp). */
export declare function dmyTime(input: string | Date | null | undefined): string;
/** Whole days from today (the Gulf day) to the date: 0 today, 1 tomorrow, -1 yesterday; null without a date. */
export declare function daysFrom(input: string | Date | null | undefined, today?: Date): number | null;
