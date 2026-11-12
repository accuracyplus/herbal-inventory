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
/**
 * The tour's own words. An app whose screens are in another language (D-043) passes its own;
 * every one left out stays as here, so the hub's tour reads exactly as before.
 */
export interface TourLabels {
    /** "Step 2 of 6": {n} and {of} are filled in. */
    step: string;
    skip: string;
    back: string;
    next: string;
    finish: string;
    doneTitle: string;
    doneText: string;
    dontShow: string;
    done: string;
}
export declare const TOUR_LABELS: TourLabels;
export interface FirstLoginTourProps {
    open: boolean;
    steps?: TourStep[];
    context?: Record<string, unknown>;
    onSkip: () => void;
    /** `dontShowAgain` true → the host stores tour_done_at on the account. */
    onDone: (dontShowAgain: boolean) => void;
    /** The tour's own words, in the screen's language. Any left out stay English (TOUR_LABELS). */
    labels?: Partial<TourLabels>;
    /** The language of those words, for the card's `lang` (D-041 / D-043). */
    lang?: string;
}
export declare function FirstLoginTour({ open, steps, context, onSkip, onDone, labels, lang }: FirstLoginTourProps): import("react").JSX.Element | null;
