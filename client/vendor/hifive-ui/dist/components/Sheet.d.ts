import { type ReactNode } from 'react';
/**
 * C9 · Sheet. Bottom sheet on a phone, centred 520px dialog on desktop.
 * Rounded 28px, scrim with blur, 44px close button, scrolls inside at
 * 88vh max. Escape and the scrim close it. No nested sheets (Part O).
 *
 * It draws on top of the whole page (15 Nov 2026): drawn in place, a sheet sat inside its
 * card's stacking order, and on the HiFive ID portal a tap on the open Appearance sheet landed
 * on the list row underneath. It is moved to the nearest element that carries the theme
 * (data-hf-portal, data-theme, .dark, data-skin, data-style), or to <body> when that is <html>,
 * so it keeps the app's colours (Recruitment's phone sheets lost their background under <body>).
 */
export declare function sheetHost(from: Element | null): Element | null;
export interface SheetProps {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    /** Up to 720px on a desktop, for a sheet that holds a table or a long form. */
    wide?: boolean;
    /** An editing sheet: typing or choosing in it counts as unsaved work, and leaving the page asks first (C21, 20 Nov 2026). Not for Filters or More sheets. */
    guard?: boolean;
}
export declare function Sheet({ open, title, subtitle, onClose, children, wide, guard }: SheetProps): import("react").JSX.Element;
