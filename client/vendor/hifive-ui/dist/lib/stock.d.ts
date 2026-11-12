/**
 * "Stock in hand" (Inventory in the suite; approved 12 Nov 2026). The words the
 * card and the hub tile say, kept here so they can be tested without React.
 *
 * Stock in hand = lines a person has taken from Inventory and not yet marked
 * used or returned. "To account for" = those held past the unit's window
 * (24 hours unless the unit changed it). Counts and dates only.
 */
export interface StockUnit {
    unit: string;
    holding: number;
    unaccounted: number;
    since: string | null;
    hours: number;
    href: string | null;
}
/** What the card is told. `undefined` (no prop) means Inventory does not know the person: no card at all. */
export type StockState = {
    state: 'loading';
} | {
    state: 'down';
} | {
    state: 'ok';
    holding: number;
    unaccounted: number;
    since: string | null;
    units: StockUnit[];
};
/** "3 Nov" this year, "3 Nov 2025" another year. */
export declare function shortDay(iso: string | null | undefined, today?: Date): string;
export declare const itemsWord: (n: number) => string;
/** The card's lead line. */
export declare const stockLead: (holding: number) => string;
/** The amber chip, or null when nothing is past its window. */
export declare function stockChip(unaccounted: number, since: string | null, today?: Date): string | null;
/** The one line under the chip that says what "to account for" means. Uses the shortest window among the units. */
export declare function stockWhy(units: StockUnit[]): string;
/** One unit's line in the breakdown. */
export declare function unitLine(u: StockUnit, today?: Date): string;
/** The hub tile's label (a C4 Tile label is plain words). */
export declare function stockTileLabel(holding: number, unaccounted: number): string;
/** The hub tile shows only when something is held, or Inventory did not answer. Never for "nothing held" or "not known". */
export declare function showStockTile(s: StockState | undefined | null): boolean;
/** Where "With me" opens from the card: one link when every unit shares it, else one per unit. Only ever for the person themself. */
export declare function stockLinks(units: StockUnit[], self: boolean): {
    single: string | null;
    perUnit: boolean;
};
