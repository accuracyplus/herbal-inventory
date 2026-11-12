import { type StockState } from '../lib/stock';
/**
 * Stock in hand (Inventory in the suite; approved 12 Nov 2026,
 * docs/audits/2026-11-12-stock-in-hand-go-no-go.md).
 *
 * What a person has taken from Inventory and not yet marked used or returned.
 * Counts and dates only. The total leads; "to account for" is the warning
 * status chip (amber, never danger) with one line saying what it means; a
 * breakdown by unit only when there is more than one. The link into
 * Inventory's "With me" is for the person themself; a manager or HR sees the
 * counts and a note. Not known to Inventory: render no card at all (leave the
 * prop off); Inventory did not answer: say so, never 0.
 */
export interface StockCardProps {
    stock: StockState;
    /** The viewer is the person: show the link into Inventory. */
    self?: boolean;
    /** "Try again" when Inventory did not answer. */
    onRetry?: () => void;
    /** For tests and stories; defaults to now. */
    today?: Date;
}
export declare function StockCard({ stock, self, onRetry, today }: StockCardProps): import("react").JSX.Element;
