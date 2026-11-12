import type { ReactNode } from 'react';
/**
 * C1 · Greeting header. Anchors the screen in the person's day. The date
 * sits in the top bar beside the search pill and the gear; the greeting
 * below in display type. Never shows the role twice (the profile card does).
 *
 * The greeting follows the READER's clock (good morning where they are);
 * the caller passes `now` so a test can pin it.
 */
export interface GreetingProps {
    firstName: string;
    reportsTo?: string | null;
    /** Direct reports; 0 hides the line. */
    leads?: number;
    /** "6 years 2 months with us", already worded by the caller. */
    tenure?: string | null;
    quote?: {
        body: string;
        author?: string | null;
    } | null;
    /** Slot for the C13 search pill. */
    search?: ReactNode;
    onAppearance?: () => void;
    onPrivacy?: () => void;
    now?: Date;
}
export declare function timeGreeting(now?: Date): string;
export declare function Greeting({ firstName, reportsTo, leads, tenure, quote, search, onAppearance, onPrivacy, now }: GreetingProps): import("react").JSX.Element;
