import { type ReactNode } from 'react';
import { type Layout } from '../lib/arrange';
/**
 * Part S · BentoGrid. The page arranges itself from blocks that declare
 * `show`, `priority` and `size` (column spans for phone, tablet, desktop).
 * Hidden blocks are never placed: no empty box, no gap, no zero.
 *
 * The DOM is in priority order, so keyboard and screen-reader order follow
 * priority even where desktop placement puts a block beside a taller one.
 * Each block's height is measured and the page re-placed when it changes;
 * until a block reports, it holds `reserve` px so data arriving late does
 * not make the page jump (Part O: nothing shifts when data arrives).
 */
export interface BentoBlock {
    id: string;
    show: boolean;
    priority: number;
    /** Column span on [phone (2 cols), tablet (4), desktop (4)]: small tile 1, card 2, wide 4. */
    size: [number, number, number];
    /** Height to hold before the block has measured itself, in px. */
    reserve?: number;
    node: ReactNode;
}
export declare function useLayout(): Layout;
export declare function BentoGrid({ blocks, label, layout: forced }: {
    blocks: BentoBlock[];
    label?: string;
    layout?: Layout;
}): import("react").JSX.Element;
