import type { ReactNode } from 'react';
import { type MonthState, type StepState } from '../lib/controls';
/**
 * Shared workflow pieces added for Performance Hub (Part J, approved with the
 * Performance Hub prototypes, 11 Nov 2026): month strip, stepper with a
 * skipped state, timeline and documents list. Every later app reuses them.
 */
export interface StripMonth {
    label: string;
    state: MonthState;
}
/** One box per month: Rated (ok), Not rated (danger), Skipped (struck,
 *  grey), Still to come (dashed). The icon and the strike carry the meaning
 *  as well as the colour (Part F). Read aloud as one sentence. */
export declare function MonthStrip({ months, label }: {
    months: readonly StripMonth[];
    label?: string;
}): import("react").JSX.Element;
/** The key for the strip, with its hint. Shown once per screen, not per row. */
export declare function MonthKey({ hint }: {
    hint?: string;
}): import("react").JSX.Element;
export interface Step {
    key: string;
    title: string;
    sub?: ReactNode;
    state: StepState;
}
/** A vertical stepper. Done is a tick, skipped is a dash with its title
 *  struck through, the current step has a ring. Every step can be opened. */
export declare function Stepper({ steps, selected, onSelect, label }: {
    steps: readonly Step[];
    selected?: string | null;
    onSelect?: (key: string) => void;
    label: string;
}): import("react").JSX.Element;
export interface TimelineItem {
    key: string;
    date: string;
    title: ReactNode;
    sub?: ReactNode;
    extra?: ReactNode;
}
export declare function Timeline({ items, label }: {
    items: readonly TimelineItem[];
    label: string;
}): import("react").JSX.Element;
export interface DocItem {
    key: string;
    name: string;
    href?: string;
    meta?: string; /** A control at the end of the row, for example Remove or Withdraw. The app confirms it in the page. */
    end?: ReactNode;
}
/** Attached documents and an Add button. The quiet empty line says so;
 *  never an empty box. */
export declare function DocumentList({ docs, onAdd, addLabel, accept, empty, busy }: {
    docs: readonly DocItem[];
    onAdd?: (file: File) => void;
    addLabel?: string;
    accept?: string;
    empty?: string;
    busy?: boolean;
}): import("react").JSX.Element;
