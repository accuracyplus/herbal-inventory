import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { type SortState } from '../lib/controls';
/**
 * Part O core controls. Every app's forms, tables and filters use these, so
 * a rule changed here changes everywhere. Derived tokens only.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** primary: one per view, never two side by side. secondary: Back, Cancel,
     *  and destructive actions (with a confirmation sheet). quiet: inline. */
    variant?: 'primary' | 'secondary' | 'quiet';
    /** Primary fills its row by default; fit sizes it to its words. */
    fit?: boolean;
    icon?: ReactNode;
    busy?: boolean;
}
export declare function Button({ variant, fit, icon, busy, className, children, type, ...rest }: ButtonProps): import("react").JSX.Element;
interface FieldBits {
    label: ReactNode;
    /** Shown under the label: what the field is for, in a few words. */
    hint?: ReactNode;
    /** What to fix, said next to the field (never in a toast). */
    error?: ReactNode;
    /** Required is the default; optional fields say so in the label. */
    optional?: boolean;
    /** Hide the label visually but keep it for screen readers. */
    hideLabel?: boolean;
}
export type TextFieldProps = FieldBits & InputHTMLAttributes<HTMLInputElement>;
export declare function TextField({ label, hint, error, optional, hideLabel, id, className, ...rest }: TextFieldProps): import("react").JSX.Element;
export type TextAreaProps = FieldBits & TextareaHTMLAttributes<HTMLTextAreaElement> & {
    /** A count shows only when there is a limit (Part O). */
    maxLength?: number;
};
export declare function TextArea({ label, hint, error, optional, hideLabel, id, className, rows, maxLength, value, ...rest }: TextAreaProps): import("react").JSX.Element;
export type SelectOption = string | {
    value: string;
    label: string;
};
export type SelectProps = FieldBits & SelectHTMLAttributes<HTMLSelectElement> & {
    options: readonly SelectOption[];
    placeholder?: string;
};
/** The native select: on a phone it opens the phone's own picker (Part O). */
export declare function Select({ label, hint, error, optional, hideLabel, id, className, options, placeholder, ...rest }: SelectProps): import("react").JSX.Element;
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: ReactNode;
    sub?: ReactNode;
}
/** 20px box, the whole 44px row is the label. */
export declare function Checkbox({ label, sub, id, className, ...rest }: CheckboxProps): import("react").JSX.Element;
export interface SegmentedProps<V extends string> {
    label: ReactNode;
    options: readonly (V | {
        value: V;
        label: ReactNode;
    })[];
    value: V | '' | null | undefined;
    onChange: (v: V) => void;
    hint?: ReactNode;
    error?: ReactNode;
    optional?: boolean;
    hideLabel?: boolean;
    /** Tapping the chosen option again clears it (for optional answers). */
    clearable?: boolean;
    onClear?: () => void;
}
/** Two to five options, 40px tall, the chosen one in --primary. */
export declare function Segmented<V extends string>({ label, options, value, onChange, hint, error, optional, hideLabel, clearable, onClear }: SegmentedProps<V>): import("react").JSX.Element;
export interface ChoiceOption<V extends string> {
    value: V;
    title: ReactNode;
    /** One or two plain sentences on what choosing this means. */
    sub?: ReactNode;
    /** A small tag beside the title, for example the choice in force now. */
    tag?: ReactNode;
    /** Shown under the card only while it is the chosen one: the extra field or warning that choice needs. */
    detail?: ReactNode;
}
export interface ChoiceCardsProps<V extends string> {
    label: string;
    options: readonly ChoiceOption<V>[];
    value: V | '' | null | undefined;
    onChange: (v: V) => void;
    hint?: ReactNode;
    error?: ReactNode;
    hideLabel?: boolean;
}
/**
 * One choice out of a few, where each needs a sentence to explain it (Part J
 * addition, approved with the Performance Hub round 2 prototypes, 11 Nov
 * 2026). A radio group drawn as cards: the whole card is the target, the
 * chosen one takes the primary border and tint, and what that choice needs
 * next opens directly under it. Use Segmented when a word is enough.
 */
export declare function ChoiceCards<V extends string>({ label, options, value, onChange, hint, error, hideLabel }: ChoiceCardsProps<V>): import("react").JSX.Element;
export interface ScoreGroupProps {
    label: ReactNode;
    value: number | null | undefined;
    onChange: (n: number) => void;
    max?: number;
    hint?: ReactNode;
    error?: ReactNode;
    /** The words at each end of the scale. */
    ends?: [string, string];
    children?: ReactNode;
}
/** A 1 to max button group, every button 44px. Children (a comment box)
 *  sit under the scale, inside the same group. */
export declare function ScoreGroup({ label, value, onChange, max, hint, error, ends, children }: ScoreGroupProps): import("react").JSX.Element;
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    pressed?: boolean;
    count?: number;
}
/** A filter chip: 32px, a 44px touch area around it. */
export declare function Chip({ pressed, count, className, children, type, ...rest }: ChipProps): import("react").JSX.Element;
export declare function ChipGroup({ label, children }: {
    label: string;
    children: ReactNode;
}): import("react").JSX.Element;
export type StatusTone = 'ok' | 'warn' | 'danger' | 'plain';
/** A status chip: fixed status colours only, never palette colours, and
 *  always an icon beside the words (Part F). */
export declare function StatusChip({ tone, icon, children }: {
    tone: StatusTone;
    icon?: ReactNode;
    children: ReactNode;
}): import("react").JSX.Element;
/** `action` is one thing to do about it, said at the end of the banner: "Try again". */
export declare function Banner({ tone, icon, children, role, action }: {
    tone?: 'ok' | 'warn' | 'danger' | 'plain';
    icon?: ReactNode;
    children: ReactNode;
    role?: 'status' | 'alert';
    action?: {
        label: string;
        onClick: () => void;
    };
}): import("react").JSX.Element;
export interface ListRowProps {
    title: ReactNode;
    sub?: ReactNode;
    icon?: ReactNode;
    /** A status chip or a short action word, before the chevron. */
    trailing?: ReactNode;
    below?: ReactNode;
    href?: string;
    onClick?: () => void;
    chevron?: boolean;
}
/** icon · title · subtitle · trailing value or chevron; 52px; divider --line. */
export declare function ListRow({ title, sub, icon, trailing, below, href, onClick, chevron }: ListRowProps): import("react").JSX.Element;
export declare function ListCard({ caption, children, action }: {
    caption?: ReactNode;
    children: ReactNode;
    action?: ReactNode;
}): import("react").JSX.Element;
export interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => ReactNode;
    /** The value sorted on; without it the column cannot be sorted. */
    sortValue?: (row: T) => unknown;
    /** On a phone, a lead column is the card's heading rather than a label-value pair. */
    lead?: boolean;
    /** CSS grid track at desktop, e.g. "96px" or "minmax(0, 2fr)". */
    width?: string;
    align?: 'start' | 'end';
}
export interface DataTableProps<T> {
    caption: string;
    columns: readonly Column<T>[];
    rows: readonly T[];
    rowKey: (row: T) => string;
    onRowClick?: (row: T) => void;
    rowHref?: (row: T) => string;
    empty?: ReactNode;
    initialSort?: SortState | null;
    /** Hide the visible caption (it stays for screen readers). */
    hideCaption?: boolean;
    /** Many columns: stay as cards until 1024px, where a grid of them first fits. */
    wide?: boolean;
}
/**
 * Flat even in Soft; header 13px uppercase muted; rows 48px; zebra by
 * --surface-2; sticky header; sort by tapping a header. On a phone each row
 * becomes a card of label-value pairs, never a sideways-scrolling table.
 * Empty cells are left out on a phone and blank at desktop: never a dash.
 */
export declare function DataTable<T>({ caption, columns, rows, rowKey, onRowClick, rowHref, empty, initialSort, hideCaption, wide }: DataTableProps<T>): import("react").JSX.Element;
/** Skeleton blocks shaped like what is coming; never a full-page spinner. */
export declare function Skeleton({ lines, height, block }: {
    lines?: number;
    height?: number;
    block?: number;
}): import("react").JSX.Element;
export declare function Loading({ label, children }: {
    label?: string;
    children?: ReactNode;
}): import("react").JSX.Element;
/** Plain text of a node, for aria labels built from children. */
export declare function textOf(node: ReactNode): string;
export {};
