export declare const ICON_BASE = "https://hifive-design.pages.dev/icons/v2";
export interface AppIconFiles {
    ico: string;
    svg: string;
    touch: string;
    icon192: string;
    icon512: string;
    maskable512: string;
}
/** The six addresses of an app's icon set in a palette, or null for an app outside the family. */
export declare function appIconFiles(app: string, skin?: string | null, base?: string): AppIconFiles | null;
interface LinkLike {
    getAttribute(n: string): string | null;
    setAttribute(n: string, v: string): void;
}
interface DocLike {
    querySelectorAll(sel: string): ArrayLike<LinkLike>;
    createElement?(tag: string): LinkLike;
    head?: {
        appendChild(n: unknown): unknown;
    } | null;
}
/**
 * Point the page's tab and home-screen icon links at the person's palette. Water keeps the app's
 * own local files when `keepLocalWater` is left on (they are the same images, and work offline).
 * Returns how many links were changed. Safe to call again whenever the palette changes.
 */
export declare function syncAppIcons(app: string, skin?: string | null, opts?: {
    doc?: DocLike;
    base?: string;
    keepLocalWater?: boolean;
}): number;
export {};
