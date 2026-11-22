import { type ReactNode } from 'react';
/**
 * StageLanes — people (or anything) in stages, moved from one stage to the next
 * (Recruitment stage 2, release 3, 13 Nov 2026; prototype QUC6vpFsqbjy2BzjXCXdd8,
 * the Journey boards). Ported from Recruitment's own board, which had the moving
 * right: a pointer drags once it has moved a few pixels (a plain click opens);
 * a finger presses and holds to lift a card (a swipe still scrolls); the keyboard
 * uses Space to pick up, the arrows to choose a stage, Space or Enter to drop and
 * Escape to cancel. Every step is said aloud, and counts preview the move.
 *
 * From 1024px the stages are lanes side by side, each scrolling on its own. Below
 * that, one stage at a time: the stage chips choose which, and a person is moved
 * from their own page (no dragging on a phone). Without `onMove` it is view only.
 */
export interface LaneCard {
    title: ReactNode;
    sub?: ReactNode;
    icon?: ReactNode;
    /** Status chips under the words. */
    chips?: ReactNode;
    /** Small things beside the title that act on their own (they must stop their events). */
    extra?: ReactNode;
    /**
     * A strip across the top of the card (14-15 Nov 2026, Recruitment's facility, Sinu: "the facility
     * should be shown like Design C"): text left, aside right, in the colours given. The caller
     * guarantees bg/fg clear 4.5:1. On a phone it is a thin strip above the row, outside its button.
     */
    head?: {
        text: ReactNode;
        aside?: ReactNode;
        bg: string;
        fg: string;
    };
}
export interface StageLanesProps<T> {
    /** Names the whole board: "Candidate journey". */
    label: string;
    lanes: readonly {
        key: string;
        label?: string;
    }[];
    items: readonly T[];
    laneOf: (item: T) => string;
    itemKey: (item: T) => string;
    /** The words a screen reader uses for the item: usually the person's name. */
    itemName: (item: T) => string;
    card: (item: T) => LaneCard;
    onOpen: (item: T) => void;
    /** Absent: view only, nothing moves. */
    onMove?: (item: T, toLane: string) => void;
    /** A column before the stages that is not a stage itself (no drops): To contact. */
    leading?: {
        key: string;
        label: string;
        count: number;
        render: (narrow: boolean) => ReactNode;
    };
    /** One quiet line for an empty stage. */
    empty?: (lane: string) => ReactNode;
    /** The stage a phone opens on; else the first with anyone in it. */
    initialLane?: string;
    /**
     * Everyone in a stage before the app's filters. When given and larger than what is shown,
     * the lane head and the stage chip say "x of N" (restored 14 Nov 2026: the board's filtered
     * counts were lost in the redesign).
     */
    totalOf?: (lane: string) => number;
}
export declare function StageLanes<T>(props: StageLanesProps<T>): import("react").JSX.Element;
