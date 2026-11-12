/**
 * C14 · New-joiner card (Design Guide D-023). Written for the joiner: a top
 * line with where and when to report and who the manager is, then the steps,
 * each done, next or to do. A step may carry a word on where it stands
 * ("HR has your details") or one action ("Fill in your details"). No number
 * is shown before the first review.
 */
export interface JoinerStep {
    text: string;
    state: 'done' | 'next' | 'todo';
    detail?: string;
    action?: {
        label: string;
        href: string;
    };
}
export interface NewJoinerCardProps {
    firstName: string;
    /** Day since joining, 1-based. Only read when there is no `top`. */
    day?: number;
    /** When the first review (and so the first Factor) is expected, e.g. "December". */
    firstReview?: string;
    /** D-023's top line: where and when to report, and who the manager is. Replaces the day and the Factor line. */
    top?: string | null;
    /** Left out while there is nothing real to count (Learning Point's courses are still the demo set). */
    induction?: {
        done: number;
        total: number;
        unit?: string;
    } | null;
    steps: JoinerStep[];
}
export declare function NewJoinerCard({ firstName, day, firstReview, top, induction, steps }: NewJoinerCardProps): import("react").JSX.Element;
