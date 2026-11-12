import { type ReactNode } from 'react';
import { type UnitCrumb, type UnitGlance, type UnitMonth, type UnitChild, type UnitPerson } from '../lib/units';
/**
 * C16 · Drill-down pages. One template at every level: Group, facility,
 * department (UnitPage) and person (PersonPage).
 *
 * Release 1 (Sinu, 10 Nov 2026, Part L): people at a glance (counts only)
 * stands where the Factor distribution ring will go; this month's strip is
 * how many things wait in each app, from the nightly snapshot; children are
 * in name order. Nothing ranks anyone (Part A rule 5). A person's page shows
 * counts, never the items.
 *
 * The page slides in from the right going down and from the left going up
 * (`direction`); reduced motion turns that off.
 */
export declare function Breadcrumb({ crumbs, current, onCrumb }: {
    crumbs: UnitCrumb[];
    current?: string;
    onCrumb: (c: UnitCrumb) => void;
}): import("react").JSX.Element;
/**
 * People at a glance. Part A: a zero or a dash is never shown in a big tile, so
 * a count of nothing is simply no tile. C4: small tiles sit on a grid, never a
 * sideways strip; on a phone an odd last tile takes the whole row (D-022).
 */
export declare function GlanceStrip({ glance }: {
    glance: UnitGlance;
}): import("react").JSX.Element;
/** How many things wait in each app, as counts. Apps that did not answer are named, never shown as nothing. */
export declare function WaitingCounts({ month, title, footnote }: {
    month: UnitMonth | null;
    title?: string;
    footnote?: string;
}): import("react").JSX.Element;
export interface UnitPageProps {
    crumbs: UnitCrumb[];
    onCrumb: (c: UnitCrumb) => void;
    title: string;
    /** Under the title: "Your team in Front Office" when the viewer sees part of the unit. */
    note?: string;
    glance: UnitGlance;
    month: UnitMonth | null;
    /** Facilities or departments (`units`), or people (`people`) at a department. */
    units?: UnitChild[];
    people?: UnitPerson[];
    onOpenUnit?: (u: UnitChild) => void;
    onOpenPerson?: (p: UnitPerson) => void;
    /** The feed filtered to the unit, drawn by the page (the home page's own feed card). */
    feed?: ReactNode;
    direction?: 'down' | 'up';
}
export declare function UnitPage({ crumbs, onCrumb, title, note, glance, month, units, people, onOpenUnit, onOpenPerson, feed, direction }: UnitPageProps): import("react").JSX.Element;
export interface PersonPageProps {
    crumbs: UnitCrumb[];
    onCrumb: (c: UnitCrumb) => void;
    self?: boolean;
    person: {
        code: string | null;
        name: string;
        designation: string | null;
        entity: string | null;
        department: string | null;
        start_date: string | null;
        tenure_months: number | null;
    };
    line: {
        code: string | null;
        name: string;
        designation: string | null;
    }[];
    onOpenPerson?: (code: string) => void;
    probation: {
        known: false;
    } | {
        known: true;
        stage: string | null;
        month_no?: number | null;
        of_months?: number | null;
        end_date?: string | null;
    };
    waiting: UnitMonth | null;
    direction?: 'down' | 'up';
}
export declare function PersonPage({ crumbs, onCrumb, self, person, line, onOpenPerson, probation, waiting, direction }: PersonPageProps): import("react").JSX.Element;
