export interface AppHomeProps {
    /** The app key (HiFive ID's registry): picks the themed icon. */
    app: string;
    /** The app's name as the top bar shows it, e.g. "Performance Hub". */
    name: string;
    /** Called on click; the app goes to its own home screen. */
    onHome?: () => void;
    /** Or a plain link to the app's home. */
    href?: string;
    /** Icon size in px; 28 in a top bar. */
    size?: number;
    /** Hide the name and keep only the icon (a narrow phone bar). The name is still read aloud. */
    iconOnly?: boolean;
    className?: string;
}
/**
 * The app's icon and name at the top of every page, one click back to the app's home
 * (Sinu, 14 Nov 2026: "every page have option to click on the solution name or icon to return
 * to main menu"). The way back to the HiFive suite itself is HiFive ID's corner button
 * (hub-button.js), kept as it is.
 */
export declare function AppHome({ app, name, onHome, href, size, iconOnly, className }: AppHomeProps): import("react").JSX.Element;
