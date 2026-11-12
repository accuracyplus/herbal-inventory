/**
 * C12 · Appearance sheet. Palette, style and mode segments. Applies through
 * window.hifiveTheme (boot.js) so every app's cache is written, then calls
 * `onSave` so the host writes the person's profile (PATCH /me/prefs).
 * Dark is a choice here, never inherited from the OS (Part B).
 */
export type Prefs = {
    skin: string;
    style: string;
    mode: string;
};
export declare const SKINS: [string, string][];
/**
 * Each palette's own primary and accent, drawn as a two-tone swatch so a
 * person sees a palette before choosing it. These are the palettes'
 * identities (like an app logo), not colours used on the page: the page
 * itself still reads only derived tokens.
 */
export declare const SWATCHES: Record<string, [string, string]>;
declare global {
    interface Window {
        hifiveTheme?: {
            get(): Prefs & {
                anim: string;
            };
            set(p: Partial<Prefs>): Prefs & {
                anim: string;
            };
            skins: string[];
        };
    }
}
export declare function currentPrefs(): Prefs;
export declare function applyPrefs(p: Partial<Prefs>): void;
export interface AppearanceProps {
    open: boolean;
    onClose: () => void;
    /** Persist to the person's profile. Resolve false when it could not save. */
    onSave?: (patch: Partial<Prefs>) => Promise<boolean>;
    /** "Replay the tour" (C15), when the host has one. */
    onReplayTour?: () => void;
}
export declare function Appearance({ open, onClose, onSave, onReplayTour }: AppearanceProps): import("react").JSX.Element;
