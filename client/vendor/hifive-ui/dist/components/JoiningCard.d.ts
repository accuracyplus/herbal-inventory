import { type AskHr, type Joiner } from '../lib/joining';
/**
 * C24 · Joining your team (approved by Group HR 21 Nov 2026, @hifive/ui 0.42.0).
 * On a reporting manager's hub, directly under Waiting for you, size [2,2,2]:
 * one row per person joining their team, from the written offer until setup
 * and paperwork are done or 30 days after joining (HiFive ID decides who is
 * shown; hidden while On hold). Read-only: tapping a row opens a sheet with
 * each setup item, each known paperwork stage and day one. Nothing personal:
 * no document numbers, salary or contact details.
 *
 * Marks follow D-069: each state its own shape as well as colour. Ready and
 * done are a filled tick, being arranged and in progress a ring, held up
 * amber with "!". Never red.
 */
export interface JoiningCardProps {
    joiners: Joiner[];
    /** Rows shown before "Show N more". */
    max?: number;
    /** The card's only action (Sinu, HiFive ID chat, 21 Nov: "add the Ask HR link"): a mailto to the joiner's facility HR contact,
     *  named on the button ("Ask HR · Hana"); `to` left out when it goes to the HR list. Nothing for no button. */
    askHr?: (j: Joiner) => AskHr | null | undefined;
    /** For stories and tests. */
    today?: Date;
}
export declare function JoiningCard({ joiners, max, askHr, today }: JoiningCardProps): import("react").JSX.Element | null;
