import type { ReactNode } from 'react';
/**
 * C7 · Status rows. A card of single-line rows: icon | label | value or
 * action. Used for Waiting for you, Your letters, pending kudos, systems
 * health (admins). The value sits as a sub-line on a phone and to the right
 * from 640px, so it fits every column width. Replaces empty boxes.
 */
export interface StatusRow {
    key: string;
    icon: ReactNode;
    label: string;
    hint?: string;
    /** A quiet value ("Nothing right now", "usually same day"). */
    value?: string;
    /** A verb, two to four words ("Request a letter"). */
    action?: {
        label: string;
        onClick?: () => void;
        href?: string;
    };
}
export declare function StatusRows({ rows, label }: {
    rows: StatusRow[];
    label?: string;
}): import("react").JSX.Element | null;
/** A small green/amber/red dot for the systems-health row. */
export declare function HealthDot({ ok }: {
    ok: boolean;
}): import("react").JSX.Element;
