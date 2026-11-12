/**
 * The rules behind the Part O controls that can be checked without a browser:
 * table sorting, the stepper's marks and the month strip's words.
 */
export type SortDir = 'asc' | 'desc';
export interface SortState {
    key: string;
    dir: SortDir;
}
/** Sort a copy of the rows by one column. Blanks always go last, in both
 *  directions, so a missing date never floats to the top of a worklist. */
export declare function sortRows<T>(rows: readonly T[], sort: SortState | null, value: (row: T, key: string) => unknown): T[];
/** Tapping a header: a new column sorts ascending, the same column flips. */
export declare function nextSort(current: SortState | null, key: string): SortState;
export type StepState = 'done' | 'current' | 'skipped' | 'upcoming';
/** What a step's circle shows, and what a screen reader hears for it. */
export declare function stepMark(state: StepState, index: number): {
    mark: 'tick' | 'dash' | 'number';
    words: string;
};
export type MonthState = 'rated' | 'missing' | 'skipped' | 'future';
export declare const MONTH_WORDS: Record<MonthState, string>;
/** One sentence for the whole strip, so it is read once rather than box by box. */
export declare function monthLine(months: readonly {
    label: string;
    state: MonthState;
}[]): string;
