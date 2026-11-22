import { type LegalWords } from '../lib/legal';
export interface LegalLinksProps {
    /** Where the four pages live. Default: the HiFive ID portal's /legal/. */
    base?: string;
    /** The copyright year. Default: this year. */
    year?: number;
    /** Labels in another language (Inventory's Malayalam); English otherwise. */
    words?: Partial<LegalWords>;
    lang?: string;
    className?: string;
}
/**
 * The legal footer at the foot of every HiFive page (C20; redrawn as D-057, 15 Nov 2026, Sinu:
 * "Can we design the footer better for all?"). On a phone (900px and under) two centred lines:
 * "Terms · Privacy · Disclaimer · Copyright", then "© 2026 HiFive Holdings LLC" under them, so the
 * copyright never shares a line with a link. On a computer one line, the copyright first. Each
 * link opens the HiFive ID portal's page in a new tab. AppFrame and SignIn show it by default; an
 * app with its own frame puts one <LegalLinks /> at the end of each page, outside any card.
 */
export declare function LegalLinks({ base, year, words, lang, className }: LegalLinksProps): import("react").JSX.Element;
