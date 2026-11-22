import { type ReactNode } from 'react';
/**
 * The phone pieces of D-056 (accepted 15 Nov 2026), first built in Recruitment's Candidates
 * (PhoneSheet.jsx) and moved here so every app draws them alike. The sheet itself is the
 * library's Sheet: a bottom sheet on a phone, on top of the whole page.
 */
/** True at the phone line (900px and under). Follows the window as it is resized. */
export declare function usePhone(): boolean;
/** "Filters" with a badge counting the filters that are on; opens the app's Filters sheet. */
export declare function FiltersButton({ count, onClick, label }: {
    count?: number;
    onClick: () => void;
    label?: string;
}): import("react").JSX.Element;
/** The ⋯ button that opens a More sheet: exports, add, the actions used now and then. */
export declare function MoreButton({ onClick, label }: {
    onClick: () => void;
    label?: string;
}): import("react").JSX.Element;
export interface SheetItemProps {
    icon?: ReactNode;
    children: ReactNode;
    /** A second, quieter line. */
    sub?: ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    /** A destructive action (Delete, Withdraw): drawn in the danger colour. */
    danger?: boolean;
}
/** One row in a More sheet: an icon, the words, what it does. 52px tall. */
export declare function SheetItem({ icon, children, sub, onClick, href, disabled, danger }: SheetItemProps): import("react").JSX.Element;
/** A labelled field in a Filters sheet. Its select or input is 16px, so a phone does not zoom. */
export declare function SheetField({ label, children }: {
    label: string;
    children: ReactNode;
}): import("react").JSX.Element;
export interface FoldProps {
    title: string;
    /** Beside the title: "3 waiting". */
    count?: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
}
/** A side panel folded to one line (title and count), tapped open (D-056 rule 5). */
export declare function Fold({ title, count, defaultOpen, children }: FoldProps): import("react").JSX.Element;
export interface FiltersFooterProps {
    /** How many filters are on: Clear is offered only when one is. */
    count: number;
    onClear: () => void;
    /** How many records the filters now leave, live. Without it the button says "Done". */
    shown?: number;
    /** What the records are called: ['person', 'people']. */
    noun?: [string, string];
    /** Closes the sheet (the records are already filtered as the person chooses). */
    onShow: () => void;
}
/**
 * The foot of a Filters sheet (D-056; the HiFive ID console's pattern, 15 Nov 2026): "Clear" and
 * "Show 12 people", held at the bottom of the sheet while it scrolls. When nothing matches it says
 * so and the button reads "Close".
 */
export declare function FiltersFooter({ count, onClear, shown, noun, onShow }: FiltersFooterProps): import("react").JSX.Element;
