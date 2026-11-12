import type { ReactNode } from 'react';
import { type Tone } from '../lib/tone';
/**
 * C4 · Tile. 176×136, faded dot pattern and corner ring in the brand colour,
 * icon in a small well, value in display type, label clamped to two lines.
 * Strips scroll horizontally on phone and wrap two-up on desktop.
 */
export interface TileProps {
    tone: Tone;
    icon: ReactNode;
    value: ReactNode;
    label: string;
    /** Draw attention: a slow pulse from 1.2 s (Part E). Only for things that need action now. */
    pulse?: boolean;
    hint?: string;
    onClick?: () => void;
}
export declare function Tile({ tone, icon, value, label, pulse, hint, onClick }: TileProps): import("react").JSX.Element;
/**
 * Balance variant: "21 / 24" with 24 pips and colour bands. The thresholds
 * are NOT in this component: they come from Performance Hub's conduct policy
 * (Design Guide Part G) and arrive as props.
 */
export interface BalanceTileProps {
    score: number;
    max: number;
    /** From /policy/conduct: below `warn` is amber, below `formalWarning` is red. Until it is published the tile is neutral (D-024). */
    policy?: {
        warn: number;
        formalWarning: number;
    } | null;
    label?: string;
    hint?: string;
    onClick?: () => void;
}
export declare function BalanceTile({ score, max, policy, label, hint, onClick }: BalanceTileProps): import("react").JSX.Element;
/** A horizontal strip of tiles; wraps two-up from tablet width. */
export declare function TileStrip({ children, wrap, label }: {
    children: ReactNode;
    wrap?: boolean;
    label?: string;
}): import("react").JSX.Element;
