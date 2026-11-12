/**
 * C10 · Celebration. Full-width card (phone) or one-line pill (desktop).
 * Shown once per person per day and only when an event exists: the caller
 * reads it from /api/home (the `celebrations` table) and marks it shown.
 * Light confetti on phone only; respects reduced-motion and Lite.
 * Celebrate without hype (Part N): no exclamation marks.
 */
export type CelebrationType = 'factor_band' | 'probation_confirmed' | 'induction_complete' | 'anniversary' | 'kudos';
export interface CelebrationProps {
    type: CelebrationType;
    title: string;
    detail?: string;
    onDismiss: () => void;
}
export declare function Celebration({ type, title, detail, onDismiss }: CelebrationProps): import("react").JSX.Element;
