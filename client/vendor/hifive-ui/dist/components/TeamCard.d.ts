/**
 * Your team (managers only, priority 80): the people who report to the
 * reader, as avatar rows with the one thing coming up for each. Never ranks
 * them (Part A rule 5): order is by name, never by score.
 */
export interface TeamMember {
    name: string;
    sub?: string | null;
    note?: string | null;
    onOpen?: () => void;
}
export declare function TeamCard({ members, total }: {
    members: TeamMember[];
    total?: number;
}): import("react").JSX.Element | null;
