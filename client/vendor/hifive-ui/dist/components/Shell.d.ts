import type { ReactNode } from 'react';
import { type SignInWords } from '../lib/shell';
export interface SignInLanguage {
    value: string;
    label: string;
    lang?: string;
}
export interface SignInProps {
    /** The app's key in the logo family (Part Q): 'inventory', 'recruitment', 'performance', 'lms'. */
    app: string;
    /** "HiFive Inventory" */
    name: string;
    /** "Inventory", for "Sign in to Inventory" */
    short: string;
    /** One sentence on what the app is for. */
    lede: ReactNode;
    /** Who gets in: "HR gives access to Inventory." */
    note?: ReactNode;
    /** A sign-in that was cancelled or failed: one plain line. */
    error?: ReactNode;
    busy?: boolean;
    onContinue: () => void;
    /** Only for an app with a second language (Inventory's English and Malayalam). */
    languages?: readonly SignInLanguage[];
    language?: string;
    onLanguage?: (value: string) => void;
    /** The footer's help line: who to ask. */
    help?: ReactNode;
    /** The legal line under the footer (LegalLinks by default); false only where a page must not show it. */
    legal?: ReactNode | false;
    /** Any line replaced, for an app's own language. */
    words?: Partial<SignInWords>;
    /** The language of the app's own lines (name, lede, words), e.g. 'ml'. */
    lang?: string;
}
/**
 * One sign-in screen for every app, matched to the HiFive ID portal's. A band in the palette's
 * deep colours with the app's logo, name and sentence; a card with one button. Before sign-in the
 * palette is the one boot.js kept on this device, else Water. No quotes, no provider buttons.
 */
export declare function SignIn(p: SignInProps): import("react").JSX.Element;
export interface TabItem {
    key: string;
    label: ReactNode;
    icon: ReactNode;
    href?: string;
    onClick?: () => void;
    current?: boolean;
    /** Passed through to the element, e.g. { 'data-tour': 'nav-today' } for a walkthrough. */
    attrs?: Record<string, string>;
}
export interface TabBarProps {
    items: readonly TabItem[];
    /** More: the screens not on the bar, then settings (D-044). */
    more?: Omit<TabItem, 'key'>;
    label?: string;
    className?: string;
}
/**
 * The phone's bottom bar: full width, fixed to the bottom edge above the safe area, with a spacer
 * in the page so nothing sits under it. An icon over a one-line name; the current screen in the
 * brand text colour with a soft tint behind its icon. No counts on it (Part P).
 */
export declare function TabBar({ items, more, label, className }: TabBarProps): import("react").JSX.Element;
export interface SideItem {
    key: string;
    label: ReactNode;
    icon?: ReactNode;
    href?: string;
    onClick?: () => void;
    current?: boolean;
    attrs?: Record<string, string>;
}
export interface SideGroup {
    key: string;
    label?: ReactNode;
    items: readonly SideItem[];
}
export interface SideMenuProps {
    label?: string;
    /** The app's logo and name, at the top. */
    brand?: ReactNode;
    /** Anything between the brand and the groups: a unit switch, say. */
    head?: ReactNode;
    groups: readonly SideGroup[];
    /** At the foot: All HiFive apps, the person's menu. */
    foot?: ReactNode;
}
/** The side menu of an app with more than six sections or sections in groups (D-049). From 1024px only. */
export declare function SideMenu({ label, brand, head, groups, foot }: SideMenuProps): import("react").JSX.Element;
export interface AppFrameProps {
    /** A SideMenu for an app that has one (D-049); otherwise the top bar alone. */
    side?: ReactNode;
    /** The top bar inside the panel. */
    top?: ReactNode;
    /** The phone bar (TabBar), shown below 1024px. */
    tabs?: ReactNode;
    /** The legal line after the page (LegalLinks by default); false only where a page must not show it. */
    legal?: ReactNode | false;
    children: ReactNode;
}
/**
 * The frame every app sits in: on a computer the palette's deep ground with one rounded panel on
 * it, the top bar or the side menu inside the panel; on a phone the panel fills the screen and the
 * phone bar sits at the bottom.
 */
export declare function AppFrame({ side, top, tabs, legal, children }: AppFrameProps): import("react").JSX.Element;
