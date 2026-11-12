/**
 * Design Guide Part S — smart arrangement. Pure, so it can be tested without
 * a browser and reused by any app that does not render with React.
 *
 * 1. Hidden blocks are never placed (the caller filters on `show`).
 * 2. Visible blocks are sorted by priority, highest first; ties keep the
 *    caller's order.
 * 3. Phone and tablet: in a run of narrow blocks between full-width ones, the
 *    last narrow block widens so no row ends half empty (no orphans).
 * 4. Each block, in priority order, goes where it starts highest without
 *    leaving a gap under itself: score = top + the gap it would leave; lowest
 *    score wins, leftmost on a tie.
 *
 * 5. Backfill, every screen (D-022): a small tile moves up into a gap under a
 *    block that it fits. Only small tiles move; the page's DOM stays in
 *    priority order, so keyboards and screen readers are unaffected.
 * 6. No orphans, every screen (D-022): a small tile widens into free columns
 *    beside it to close its row.
 *
 * Heights are in grid rows (4px each in BentoGrid), measured by the caller.
 * A block not yet measured counts as `fallback` rows.
 */
export type Layout = 'phone' | 'tablet' | 'desktop';
export interface ArrangeBlock {
    id: string;
    priority: number;
    size: [number, number, number];
}
export interface Placement {
    id: string;
    col: number;
    row: number;
    span: number;
    rows: number;
}
export declare const columnsFor: (layout: Layout) => 2 | 4;
export declare function sortBlocks<T extends ArrangeBlock>(blocks: T[]): T[];
export declare function spansFor(blocks: ArrangeBlock[], layout: Layout): number[];
export declare function arrange(sorted: ArrangeBlock[], layout: Layout, heights: Record<string, number>, fallback?: number): Placement[];
