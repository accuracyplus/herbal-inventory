/**
 * Part Q · App logo family (D-029, approved as D-042 on 12 Nov 2026).
 *
 * One rounded square in the palette's --primary with the app's symbol in
 * --on-primary, so every logo follows the palette, style and mode together.
 * The short name goes underneath, outside the logo (`AppLogoTile`).
 * An unknown key draws HiFive ID's shield. Decorative by default (the name is
 * beside it); pass `label` when the logo stands alone.
 */
export interface AppLogoProps {
    app: string;
    size?: number;
    /** Read aloud when the logo stands alone. Leave off when the name is written beside it. */
    label?: string;
    className?: string;
}
export declare function AppLogo({ app, size, label, className }: AppLogoProps): import("react").JSX.Element;
/** A logo with its short name underneath, as the hub's apps list and a phone's home screen show it. */
export declare function AppLogoTile({ app, size, name }: {
    app: string;
    size?: number;
    name?: string;
}): import("react").JSX.Element;
