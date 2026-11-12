import { matchPeople } from '../lib/people';
export { matchPeople };
/**
 * C6 · Give kudos (button + sheet). Sheet: who, message (4–280 chars),
 * inline validation on submit (Part O: never on every keystroke), note that
 * HR approves. Kudos reach the feed only after HR approves (Part S, Sinu
 * 10 Nov 2026); on send the caller shows the "N kudos with HR" tile.
 *
 * WHO is type-to-find rather than a <select> (10 Nov 2026, logged under
 * Part L): the group is hundreds of people, and two can share a name, so each
 * match shows job and facility. Matching is on every word of the name.
 */
export type { Person } from '../lib/people';
import type { Person } from '../lib/people';
export interface GiveKudosProps {
    people: Person[];
    onSend: (to: Person, message: string) => Promise<void> | void;
}
export declare function GiveKudosButton({ onClick }: {
    onClick: () => void;
}): import("react").JSX.Element;
export declare function GiveKudosSheet({ open, onClose, people, onSend }: GiveKudosProps & {
    open: boolean;
    onClose: () => void;
}): import("react").JSX.Element;
