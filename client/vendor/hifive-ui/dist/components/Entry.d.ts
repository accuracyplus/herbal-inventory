import { type InputHTMLAttributes, type ReactNode } from 'react';
import { type PickOption } from '../lib/entry';
/**
 * Entry and summary pieces added for HiFive Inventory (Part J, approved with the
 * Inventory prototypes, 12 Nov 2026): a picker you type into, a quantity field,
 * a key and value summary, a plain quiet line and the unit switch. Nothing here
 * knows about stock: every later app reuses them.
 */
export interface PickerOption extends PickOption {
    /** A second line under the label: a code, a category, where it is. */
    sub?: ReactNode;
    /** A short value at the end of the row: how many are left. */
    end?: ReactNode;
    /** The end value's meaning, when it is a warning. Shown with the words, never alone. */
    endTone?: 'warn' | 'danger';
}
export interface PickerProps<T extends PickerOption> {
    label: string;
    options: readonly T[];
    onPick: (option: T) => void;
    /** Shown in the box until something is typed. */
    placeholder?: string;
    hint?: ReactNode;
    error?: ReactNode;
    /** Hide the label visually but keep it for screen readers. */
    hideLabel?: boolean;
    /** How many matches to offer at most. */
    limit?: number;
    /** Said when nothing matches; gets what was typed. */
    empty?: (typed: string) => ReactNode;
    /** A last row under the matches: "Scan its barcode instead". */
    footer?: ReactNode;
    id?: string;
}
/**
 * Type to find, then choose one. An exact code (a barcode, an item code) is
 * chosen as soon as Enter is pressed. Up and Down move, Enter chooses, Escape
 * closes. After a choice the box empties, ready for the next one.
 */
export declare function Picker<T extends PickerOption>({ label, options, onPick, placeholder, hint, error, hideLabel, limit, empty, footer, id }: PickerProps<T>): import("react").JSX.Element;
export interface QuantityFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max' | 'step'> {
    label: string;
    /** What is typed, kept as text so "1." does not jump back to "1". */
    value: string | number | null | undefined;
    onChange: (text: string) => void;
    /** What it is counted in, said after the number: bottle, kg. */
    unit?: ReactNode;
    min?: number;
    max?: number;
    /** One press of minus or plus. Typing accepts any part quantity. */
    step?: number;
    /** Leave the minus and plus out where there is no room for them (a count sheet). */
    bare?: boolean;
    hint?: ReactNode;
    error?: ReactNode;
    hideLabel?: boolean;
}
/**
 * A number, what it is counted in, and one step down or up. The buttons are 44px;
 * the number is the phone's decimal keypad. Scrolling the page never changes it.
 */
export declare function QuantityField({ label, value, onChange, unit, min, max, step, bare, hint, error, hideLabel, id, className, ...rest }: QuantityFieldProps): import("react").JSX.Element;
export interface KeyValue {
    label: string;
    value: ReactNode;
}
/** A short summary of labelled facts. A fact with no value is left out: never a dash. */
export declare function KeyValues({ items, columns }: {
    items: readonly KeyValue[];
    columns?: 2 | 3 | 4;
}): import("react").JSX.Element | null;
/** An empty section collapses to this one line (Part A rule 3). Never an empty box. */
export declare function Quiet({ children, icon }: {
    children: ReactNode;
    icon?: ReactNode;
}): import("react").JSX.Element;
/**
 * Which facility the person is working in. A button when they have more than one
 * (the app opens its own sheet of units); plain words when they have one. The
 * compact form is the pill for a phone's top bar.
 */
export declare function UnitSwitch({ name, label, onClick, compact }: {
    name: string;
    label?: string;
    onClick?: () => void;
    compact?: boolean;
}): import("react").JSX.Element;
