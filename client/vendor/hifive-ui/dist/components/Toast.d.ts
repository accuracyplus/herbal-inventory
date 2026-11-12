/**
 * A short confirmation at the foot of the screen, with one action (C17:
 * "2 candidates sent to Recruitment · Undo"). It closes itself after `ms`
 * (5 s), and says it with role=status so a screen reader reads it once.
 */
export interface ToastProps {
    text: string | null;
    action?: {
        label: string;
        onClick: () => void;
    } | null;
    onDone: () => void;
    ms?: number;
}
export declare function Toast({ text, action, onDone, ms }: ToastProps): import("react").JSX.Element | null;
