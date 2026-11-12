/**
 * C15 · First-login tour. On a person's first sign-in, a guided walk through
 * the page, one step per section. Each step dims the page, spotlights the
 * section, shows one to two sentences and Next / Back / Skip. The last step
 * is a confirmation sheet with "I understand, don't show this again".
 *
 * The acknowledgement is stored against the EMPLOYEE ACCOUNT (tour_done_at,
 * POST /me/tour), never the device, so it never repeats on another phone.
 * Skip stores nothing; the tour offers itself again next login.
 *
 * Steps are a list { selector, title, text, when? }: adding a section is
 * one line. A step whose selector is not on the page is skipped, so a page
 * that does not show every section (no Factor yet) still reads in order.
 * Keyboard: arrows step, Enter next, Escape skips. Respects reduced-motion.
 */
export interface TourStep {
    selector: string;
    title: string;
    text: string;
    /** Hide the step for some people, e.g. the team step for non-managers. */
    when?: (ctx: Record<string, unknown>) => boolean;
}
export declare const TOUR_STEPS: TourStep[];
export interface FirstLoginTourProps {
    open: boolean;
    steps?: TourStep[];
    context?: Record<string, unknown>;
    onSkip: () => void;
    /** `dontShowAgain` true → the host stores tour_done_at on the account. */
    onDone: (dontShowAgain: boolean) => void;
}
export declare function FirstLoginTour({ open, steps, context, onSkip, onDone }: FirstLoginTourProps): import("react").JSX.Element | null;
