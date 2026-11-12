import type { ReactNode } from 'react';
import { type Tone } from '../lib/tone';
/**
 * A small bento tile with words rather than a number (Part S): icon, a short
 * title in display type, one line under it, optional hint and one action.
 * Small tiles share one height; their text is at most two lines.
 * `dark` is the Know yourself variant.
 */
export interface MiniTileProps {
    tone?: Tone;
    icon: ReactNode;
    title: string;
    sub?: string;
    hint?: string;
    /** A status dot in the top corner (systems healthy). */
    dot?: 'ok' | 'warn';
    action?: {
        label: string;
        onClick?: () => void;
        href?: string;
    };
    onClick?: () => void;
    dark?: boolean;
}
export declare function MiniTile({ tone, icon, title, sub, hint, dot, action, onClick, dark }: MiniTileProps): import("react").JSX.Element;
