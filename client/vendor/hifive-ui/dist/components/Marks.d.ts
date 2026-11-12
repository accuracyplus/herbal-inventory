/**
 * AppMark — an app's own icon on a white squircle, the same size for every
 * app (Part S). An app with no logo (To-Do, the admin console) shows its
 * lucide icon on the same squircle.
 */
export declare function AppMark({ app, size, label }: {
    app: string;
    size?: number;
    label?: string;
}): import("react").JSX.Element;
export declare function Avatar({ name, size, ring, photo }: {
    name: string;
    size?: number;
    ring?: boolean;
    photo?: string | null;
}): import("react").JSX.Element;
