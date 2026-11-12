import { type ReactNode } from 'react';
import { type Tone } from '../lib/tone';
/**
 * C3 · Score ring (Factor card). Donut whose segments are each factor's
 * weighted contribution; the number counts up after the ring draws; status
 * pill with icon; sparkline under the legend; tap opens the Breakdown sheet.
 * role="img" with the full breakdown as aria-label. NEVER used for anything
 * that compares people (Part A rule 5).
 *
 * Every number here is a prop. Weights, bands and the conduct policy come
 * from Performance Hub through /api/home (Part G); nothing is hard-coded.
 */
export interface Factor {
    key: string;
    label: string;
    score: number;
    max: number;
    /** Share of the total, e.g. 50. Weights sum to 100. */
    weight: number;
    tone: Tone;
    hint: string;
    /** A balance (conduct points): shown as "21 of 24 left" with a warning mark. */
    balance?: boolean;
}
export interface Bands {
    exceeding: number;
    onTrack: number;
}
export interface ConductPolicy {
    start: number;
    warn: number;
    formalWarning: number;
    terminate: number;
}
export interface ScoreRingProps {
    factors: Factor[];
    bands: Bands;
    conductPolicy?: ConductPolicy;
    /** "On probation · checkpoint 2 of 3" or similar, or null. */
    status?: string | null;
    /** Up to six monthly totals, oldest first. */
    history?: number[];
    /** What would move it up: one to three sentences. */
    improve?: string[];
    /** No review yet: the ring shows "Building — first score next month" instead of a number. */
    building?: boolean;
    title?: string;
}
export declare function factorTotal(factors: Factor[]): number;
export declare function bandFor(total: number, bands: Bands): {
    label: string;
    icon: ReactNode;
    tone: Tone;
};
export declare function ScoreRing({ factors, bands, conductPolicy, status, history, improve, building, title }: ScoreRingProps): import("react").JSX.Element;
