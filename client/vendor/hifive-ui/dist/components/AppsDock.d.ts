import { type ReactNode } from 'react';
import { type Tone } from '../lib/tone';
/**
 * C11 · Apps dock. Desktop only: a vertical frosted dock of app icons,
 * draggable, snaps to left or right, position remembered; labels on hover;
 * first-run tooltip. On a phone the same apps are an in-page 3-up grid.
 *
 * Side, top and the tip are about the screen, not the person, so they stay
 * in localStorage (handoff Step 12).
 */
/**
 * `icon` is only for an app with no logo in @hifive/ui; otherwise its own logo (AppMark) is drawn.
 * `attention` (D-063): the app is slow right now. An amber dot on its logo and
 * the line "<App> is slow right now. We're on it." (read aloud in the dock and
 * shown on hover; shown under the name in the grid). Set it from the system
 * check; it goes when the check passes.
 */
export interface DockApp {
    key: string;
    label: string;
    icon?: ReactNode;
    tone?: Tone;
    attention?: boolean;
    onOpen: () => void;
}
export declare function AppsDock({ apps }: {
    apps: DockApp[];
}): import("react").JSX.Element;
/** The phone form of C11: a 3-up grid inside a card. Hidden from 1024px, where the dock takes over. */
export declare function AppsGrid({ apps, hideOnDesktop }: {
    apps: DockApp[];
    hideOnDesktop?: boolean;
}): import("react").JSX.Element;
