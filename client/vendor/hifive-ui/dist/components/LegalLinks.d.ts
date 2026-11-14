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
 * The legal line at the foot of every HiFive page: "© 2026 HiFive Holdings · Terms of Use ·
 * Privacy · Disclaimer · Copyright", each link opening the HiFive ID portal's page in a new tab.
 * AppFrame and SignIn show it by default; an app with its own frame puts one <LegalLinks /> in it.
 */
export declare function LegalLinks({ base, year, words, lang, className }: LegalLinksProps): import("react").JSX.Element;
