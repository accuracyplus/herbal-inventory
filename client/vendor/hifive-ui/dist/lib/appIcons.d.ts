export declare const APP_ICON_THEMES: string[];
/** The full icon at 32 px and up; the small one (solid pane, no blur) below that. */
export declare const SMALL_BELOW = 32;
export declare function appIconKey(app: string): string | null;
export declare function themeOf(skin: string | null | undefined): string;
/** The icon's SVG markup for this app, size and palette, or null when the kit has no icon for the app. */
export declare function appIconSvg(app: string, opts?: {
    size?: number;
    theme?: string | null;
}): string | null;
/** The same icon as an image address (data: URL), cached per app, size class and palette. */
export declare function appIconSrc(app: string, opts?: {
    size?: number;
    theme?: string | null;
}): string | null;
