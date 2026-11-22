/**
 * Part Q · App logo family (D-029, approved as D-042 on 12 Nov 2026; look
 * replaced 14 Nov 2026 by the layered-glass kit, Sinu: "Yes, build it").
 *
 * The kit's icon for the app: a colour shape behind a frosted pane on a white
 * squircle, the small symbol in the palette's colours (<html data-skin>, Water
 * when unset). The full icon at 32 px and up, the small one below. It follows a
 * palette change without a reload. An app the kit has no icon for keeps the
 * drawn logo: the palette's --primary square with the symbol in --on-primary.
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
/** The palette on <html data-skin>, kept current. */
export declare function useSkin(): string | null;
export declare function AppLogo({ app, size, label, className }: AppLogoProps): import("react").JSX.Element;
/**
 * D-063: the amber dot on an app's logo while that app is slow. Decorative:
 * the words (slowLine) always go beside it or are read aloud. Place it inside
 * an element with `position: relative` (`hf-attn-host`).
 */
export declare function AttentionDot(): import("react").JSX.Element;
/**
 * A logo with its short name underneath, as the hub's apps list and a phone's home screen show it.
 * `attention` (D-063): the app is slow right now; the dot goes on the logo and the line is read aloud.
 */
export declare function AppLogoTile({ app, size, name, attention }: {
    app: string;
    size?: number;
    name?: string;
    attention?: boolean;
}): import("react").JSX.Element;
