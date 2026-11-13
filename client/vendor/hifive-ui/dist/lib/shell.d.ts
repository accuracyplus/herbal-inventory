export interface SignInWords {
    /** "Sign in to {app}" */
    title: string;
    sub: string;
    button: string;
    busy: string;
    hint: string;
    oneTitle: string;
    ticks: string[];
    language: string;
    /** "About {app}", for the band's landmark */
    about: string;
}
export declare const SIGN_IN_WORDS: SignInWords;
/** The sign-in words with the app's own replacements, and {app} filled in. */
export declare function signInWords(app: string, words?: Partial<SignInWords>): SignInWords;
/** The phone bar's columns: every tab at least as wide as its own words, the rest shared. */
export declare function tabColumns(n: number): string;
