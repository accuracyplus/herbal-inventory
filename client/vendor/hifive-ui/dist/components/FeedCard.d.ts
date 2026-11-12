import type { ReactNode } from 'react';
/**
 * C5 · Feed card. Inputs: type, text, source, time, reaction counts. Pinned
 * cards have a left accent bar and sit on top; reactions are thumbs-up and
 * clap, 44px targets, counts only (nobody sees who reacted). Quiet state:
 * one card "Nothing new since yesterday" with a kudos nudge.
 */
export type FeedType = 'joiner' | 'induction' | 'probation' | 'anniversary' | 'kudos' | 'pinned';
export interface FeedItem {
    id: string;
    type: FeedType;
    /** Rich text allowed (names in <b>). */
    text: ReactNode;
    /** Pinned cards only. */
    title?: string;
    /** "Herbal Park team" for kudos. */
    from?: string | null;
    when: string;
    likes: number;
    claps: number;
    /** The reader's own reactions. */
    mine?: {
        like?: boolean;
        clap?: boolean;
    };
}
export declare function FeedCard({ item, onReact }: {
    item: FeedItem;
    onReact?: (id: string, type: 'like' | 'clap') => void;
}): import("react").JSX.Element;
/** The quiet state: shown instead of an empty list, with the kudos nudge. */
export declare function FeedQuiet({ onKudos }: {
    onKudos?: () => void;
}): import("react").JSX.Element;
/** Pinned first, then by the caller's order. */
export declare function Feed({ items, onReact, onKudos }: {
    items: FeedItem[];
    onReact?: FeedCardProps['onReact'];
    onKudos?: () => void;
}): import("react").JSX.Element;
type FeedCardProps = Parameters<typeof FeedCard>[0];
export {};
