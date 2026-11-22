import type { ReactNode } from 'react';
import { type StripOptions } from '../lib/facility';
export interface FacilityMarkProps extends StripOptions {
    /** The facility's name, as the record holds it ("Atomic Drugstore"). */
    facility?: string | null;
    className?: string;
}
/**
 * The facility's mark alone, straight on its strip colour: no tile (Sinu, 15 Nov 2026: "Make
 * the logo icon only with background", "Remove the background from logos"). Its own mark when
 * known, else the HiFive Holdings mark, else its initials. Decoration: the strip's words name it.
 */
export declare function FacilityMark({ facility, className, size, ...opts }: FacilityMarkProps): import("react").JSX.Element;
export interface FacilityStripProps extends StripOptions {
    facility?: string | null;
    /** Shown after the name, in bold (Recruitment: the branch). Defaults to `branch`. */
    detail?: ReactNode;
    /** The right-hand end of the strip (Recruitment: the priority button). */
    aside?: ReactNode;
    /** Leave out the mark (a narrow strip). */
    noMark?: boolean;
    className?: string;
}
/**
 * A facility's strip (Design Guide D-055): its pale colour behind, its dark colour for the
 * words, its mark, its name and branch, and room on the right. The colours are the facility's,
 * never the app's theme, and they stay the same in dark mode.
 */
export declare function FacilityStrip({ facility, detail, aside, noMark, className, ...opts }: FacilityStripProps): import("react").JSX.Element;
