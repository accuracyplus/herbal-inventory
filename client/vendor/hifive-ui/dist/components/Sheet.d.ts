import { type ReactNode } from 'react';
/**
 * C9 · Sheet. Bottom sheet on a phone, centred 520px dialog on desktop.
 * Rounded 28px, scrim with blur, 44px close button, scrolls inside at
 * 88vh max. Escape and the scrim close it. No nested sheets (Part O).
 */
export interface SheetProps {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    /** Up to 720px on a desktop, for a sheet that holds a table or a long form. */
    wide?: boolean;
}
export declare function Sheet({ open, title, subtitle, onClose, children, wide }: SheetProps): import("react").JSX.Element | null;
