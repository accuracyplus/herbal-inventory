/**
 * C16 · the words and filters behind the unit and person pages, kept pure so
 * they are tested without a browser (units.test.mjs).
 *
 * Nothing here ranks or compares (Part A rule 5): people keep the order the
 * server sends (name order) and a filter only narrows the list.
 */
export type UnitLevel = 'group' | 'facility' | 'department';
export interface UnitCrumb {
    level: UnitLevel;
    name: string;
    entity?: string;
    department?: string;
}
/** `probation` null = not known today (Performance Hub did not answer), never zero. */
export interface UnitGlance {
    headcount: number;
    joined: number;
    probation: number | null;
    leaving: number;
}
export interface AppWaiting {
    app: string;
    label: string;
    waiting: number;
    overdue: number;
}
export interface UnitMonth {
    day: string;
    apps: AppWaiting[];
    unknown: string[];
}
export interface UnitChild {
    level: UnitLevel;
    name: string;
    entity?: string;
    department?: string;
    brand?: string | null;
    glance: UnitGlance;
}
export interface UnitPerson {
    code: string | null;
    name: string;
    designation: string | null;
    probation: string | null;
    joined: boolean;
}
/** "15 Mar 2027" from "2027-03-15"; the input itself if it is not a date. */
export declare function dayWords(iso: string | null | undefined): string;
/** "2 years 3 months", "1 year", "5 months", "New this month". */
export declare function tenureWords(months: number | null | undefined): string;
/** The one line under a child unit's name: only what is not zero. "12 people · 1 new · 2 on probation". */
export declare function glanceLine(g: UnitGlance): string;
/** "3 waiting · 1 overdue", "Nothing waiting". */
export declare function waitingLine(a: {
    waiting: number;
    overdue: number;
}): string;
export interface PeopleFilter {
    key: string;
    label: string;
    test: (p: UnitPerson) => boolean;
}
/**
 * Filter chips for a list of people (C16: role, probation; band arrives with
 * the Factor). Only filters that would narrow the list are offered: a chip
 * that keeps everyone, or nobody, is noise.
 */
export declare function peopleFilters(people: UnitPerson[]): PeopleFilter[];
