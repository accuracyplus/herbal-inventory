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
/** Where someone is on a journey of stages, in one sentence (StageBar, Recruitment stage 2,
 *  13 Nov 2026): "Stage 3 of 11: Shortlisted. Next: Ops cleared." An unknown stage says so
 *  rather than guessing a position; the last stage has no next. */
export declare function stageLine(stages: readonly string[], current: string): {
    index: number;
    line: string;
};
/** Where the open item sits in a split view's list (SplitView, Recruitment stage 2,
 *  release 2, 13 Nov 2026): its place, the keys either side, and the words on the
 *  phone's bar, "CV 3 of 10". With nothing open, Next opens the first. */
export declare function splitStep(keys: readonly string[], current: string | null | undefined, word?: string): {
    index: number;
    prev: string | null;
    next: string | null;
    line: string;
};
/** Which item opens once `done` leaves the list (decided, filed away): the one after
 *  it, else the one before, else nothing. */
export declare function splitAfter(keys: readonly string[], done: string): string | null;
/** The lane `dir` steps from `current`, or null past either end. */
export declare function laneStep(keys: readonly string[], current: string, dir: 1 | -1): string | null;
/** The count a lane shows while a card is in the air: one less where it came
 *  from, one more where it would land. */
export declare function laneCount(count: number, lane: string, moving: {
    from: string;
    to: string | null;
} | null): number;
/** What a screen reader hears as a card moves between lanes. */
export declare const MOVE_WORDS: {
    picked: (name: string, lane: string) => string;
    lifted: (name: string) => string;
    target: (lane: string, here: boolean) => string;
    moved: (name: string, lane: string) => string;
    stays: (name: string, lane: string) => string;
    notMoved: (name: string) => string;
};
