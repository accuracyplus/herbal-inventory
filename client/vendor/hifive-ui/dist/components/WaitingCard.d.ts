import type { ReactNode } from 'react';
/**
 * Waiting for you (Part S): ONE card, first after the greeting, one row per
 * item — app logo, what, when, one action verb. Overdue items say so in the
 * attention colour with a pulsing dot on the logo (off for reduced motion and
 * the Lite tier). Admin tools never appear here.
 *
 * When nothing is waiting the page shows `WaitingQuiet` instead, a small
 * tile at priority 30; when an app could not be asked, that is said, never
 * drawn as "nothing".
 */
export interface WaitingRow {
    id: string;
    /** Registry key of the owning app, for its logo. */
    app: string;
    appName: string;
    text: ReactNode;
    /** When: "Overdue · 2 days", "Due 26 Nov", "Joining today". */
    when?: string;
    overdue?: boolean;
    /** One verb: Rate, Confirm, Open. */
    action?: string;
    count?: number;
    onClick?: () => void;
    href?: string;
}
export declare function WaitingCard({ rows, unavailable, onRetry }: {
    rows: WaitingRow[];
    unavailable?: string[];
    onRetry?: () => void;
}): import("react").JSX.Element;
/** The quiet form: a small tile, "Nothing waiting / for you today" (priority 30). */
export declare function WaitingQuiet(): import("react").JSX.Element;
