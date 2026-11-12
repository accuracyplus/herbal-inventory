/**
 * C8 · Hint. A 24px "?" circle that opens a 260px dark tooltip with one to
 * three sentences. Closes on Escape, an outside tap or a second tap.
 * Required on every score, strip, balance, feed and private element
 * (Design Guide Part A rule 2: one number, explained).
 */
export interface HintProps {
    /** One to three sentences: what the thing is, then what it means for the person. */
    text: string;
    /** Accessible name of the button; defaults to "What does this mean?". */
    label?: string;
    /** Where the tooltip hangs when it would otherwise leave the viewport. */
    align?: 'centre' | 'left' | 'right';
}
export declare function Hint({ text, label, align }: HintProps): import("react").JSX.Element;
