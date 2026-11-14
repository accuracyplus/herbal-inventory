/**
 * The legal links every HiFive page carries (14 Nov 2026, Sinu: "add copyright and disclaimers as
 * link for all pages"). The pages are static HTML on the HiFive ID portal, version 2026-11-14, so
 * any app can link to them without loading the portal. Change the wording or an address here and
 * every app follows on its next re-vendor.
 */
export declare const LEGAL_BASE = "https://hifive-id-portal.pages.dev/legal/";
export interface LegalWords {
    owner: string;
    terms: string;
    privacy: string;
    disclaimer: string;
    copyright: string;
    /** Read aloud after each link. */
    newTab: string;
    /** The name of the links' landmark. */
    label: string;
}
export declare const LEGAL_WORDS: LegalWords;
export interface LegalLink {
    key: 'terms' | 'privacy' | 'disclaimer' | 'copyright';
    label: string;
    href: string;
}
/** The four links in order, with their addresses under `base` (a trailing slash is added if missing). */
export declare function legalLinks(base?: string, words?: Partial<LegalWords>): LegalLink[];
/** "© 2026 HiFive Holdings". */
export declare function copyrightLine(year?: number, words?: Partial<LegalWords>): string;
