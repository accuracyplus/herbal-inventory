import { type ReactNode } from 'react';
/**
 * Happening at HiFive (Part S): ONE card of compact rows, never one card per
 * event. Same-type events group ("4 people joined this week", tap to see
 * who); a date appears once, on the right; three to four rows, then
 * "See all"; Give kudos at the foot. Kudos appear only after HR approves.
 * People show as initials avatars with a small badge for the kind of event.
 */
export type HappeningKind = 'joiners' | 'anniversary' | 'kudos' | 'induction' | 'probation' | 'pinned';
export interface HappeningPerson {
    name: string;
    role?: string | null;
    where?: string | null;
    on?: string;
}
export interface HappeningItem {
    id: string;
    kind: HappeningKind;
    /**
     * A group of people (tap to see who). `joiners` words itself; any other kind
     * with `people` uses `headline`, e.g. "3 people completed Fire safety" (10 Nov 2026).
     */
    headline?: ReactNode;
    /** The sentence, without the date. Not used for a group, which is worded from `people`. */
    text?: ReactNode;
    sub?: string | null;
    /** The date, once: "15 Nov", "Today". */
    when?: string;
    person?: string;
    people?: HappeningPerson[];
    likes?: number;
    claps?: number;
    mine?: {
        like?: boolean;
        clap?: boolean;
    };
}
export interface HappeningCardProps {
    items: HappeningItem[];
    /** How many rows before "See all". */
    limit?: number;
    onKudos?: () => void;
    onReact?: (id: string, type: 'like' | 'clap') => void;
}
export declare function HappeningCard({ items, limit, onKudos, onReact }: HappeningCardProps): import("react").JSX.Element;
