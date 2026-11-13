import { type ReactNode } from 'react';
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
/** Where someone is on a journey of many stages (Recruitment stage 2, 13 Nov 2026): one
 *  segment per stage, the ones reached filled, and the same sentence written under it, so
 *  the colour is never the only carrier (Part F). An unknown stage fills nothing and says so. */
export declare function StageBar({ stages, current, label }: {
    stages: readonly string[];
    current: string;
    label?: string;
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
export interface SplitViewProps {
    /** The list: rows that call `onOpen`, usually a ListCard of ListRows with `current`. */
    list: ReactNode;
    /** The item that is open. */
    children: ReactNode;
    /** The list's keys in the order shown, for Previous and Next. */
    keys: readonly string[];
    current: string | null;
    onOpen: (key: string) => void;
    /** One item's name, for the phone's bar: "CV 3 of 10". */
    word?: string;
    /** Names the list for a screen reader: "CVs to decide". */
    listLabel: string;
}
/**
 * A list beside the item it opens: the list on the left and the open item on the
 * right from 1024px, the item staying in view while the list scrolls (and scrolling
 * on its own when it is taller than the window). Below that,
 * one item at a time with Previous and Next, and "The list" to see them all; picking
 * one there opens it. Used for CV review; any one-at-a-time reading fits it.
 */
export declare function SplitView({ list, children, keys, current, onOpen, word, listLabel }: SplitViewProps): import("react").JSX.Element;
