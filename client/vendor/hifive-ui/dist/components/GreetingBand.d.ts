import type { ReactNode } from 'react';
/**
 * The greeting on a colour band (Part S, phone review 9 Nov): every home page
 * opens with the palette's deep brand colours (brand 800 → 500; Sol and dark
 * mode 900 → 700 so white text keeps contrast), a faint dot pattern and a
 * corner ring. The date, search pill and gear sit inside the band.
 */
export interface GreetingBandProps {
    firstName: string;
    reportsTo?: string | null;
    leads?: number;
    tenure?: string | null;
    quote?: {
        body: string;
        author?: string | null;
    } | null;
    search?: ReactNode;
    onAppearance?: () => void;
    onPrivacy?: () => void;
    /** A ⋯ button at the end of the top row that opens the app's More sheet (Help, My access, Sign out on a phone; D-056). */
    onMore?: () => void;
    now?: Date;
}
export declare function GreetingBand({ firstName, reportsTo, leads, tenure, quote, search, onAppearance, onPrivacy, onMore, now }: GreetingBandProps): import("react").JSX.Element;
