/**
 * C13 · Search pill. Compact pill in the top bar (300px desktop, ~55% width
 * phone). Searches people within the caller's visibility, apps and
 * policies; the results come from the caller (GET /api/search), grouped
 * People / Apps / Policies, keyboard navigable (Part O).
 */
export interface SearchResult {
    group: 'People' | 'Apps' | 'Policies';
    title: string;
    detail?: string;
    href?: string;
    onPick?: () => void;
}
export interface SearchPillProps {
    /** Called on every change after a short pause; resolve to grouped results. */
    onSearch: (q: string) => Promise<SearchResult[]>;
    placeholder?: string;
    id?: string;
}
export declare function SearchPill({ onSearch, placeholder, id }: SearchPillProps): import("react").JSX.Element;
