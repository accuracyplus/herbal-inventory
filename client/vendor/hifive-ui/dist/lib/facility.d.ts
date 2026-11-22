/**
 * The facility strip, a suite rule (Sinu, 15 Nov 2026: the facility strip "suite-wide in the
 * shared library and the Design Guide": "Yes"; Design Guide D-055).
 *
 * A facility is labelled by a strip in its pale brand colour, its words in its dark brand
 * colour, and its mark alone straight on the strip, with no tile. No two strips share a colour.
 * First built in Recruitment (welcomePost.js brandFor, logoIcons.js), and copied here as it was
 * live there on 15 Nov 2026 (main 15b48a4).
 *
 * HiFive ID keeps only lockups (the mark with the name), so the box around each mark inside
 * its lockup was measured once (15 Nov 2026) and is kept here with that logo's version. A logo
 * replaced in HiFive ID no longer matches its box; an app that passes HiFive ID's `/logos` list
 * then gets the HiFive Holdings mark instead. HiFive ID's "mark" variant, once it exists,
 * replaces these boxes.
 */
export declare const FACILITY_LOGO_BASE = "https://hifive-id.sinusuresh.workers.dev/logos";
export type FacilityKey = 'atomic' | 'apml' | 'herbal' | 'aljebal' | 'perfumes' | 'pine' | 'hifive';
export interface FacilityBrand {
    key: FacilityKey;
    /** The facility's name, for a strip that is given none. */
    name: string;
    /** The strip: the facility's pale colour. */
    bg: string;
    /** The words on the strip: its dark colour (every pair clears 4.5:1). */
    fg: string;
    /** The HiFive ID logo that holds its mark, or null: the HiFive Holdings mark stands in. */
    logo: string | null;
}
/**
 * Seven strips, no two alike. Three pinks sat side by side (Sinu, 15 Nov 2026: "Accuracy and
 * hifive and al jebal perfumes backgrounds looks similar"), so HiFive Holdings is a warm stone
 * (the group, not a facility) and Al Jebal Perfumes lavender (its plum); Accuracy Plus keeps
 * its pink. Al Jebal Perfumes has no logo of its own (Sinu: "Use the hifive holdings logo as
 * default since Al Jebal Perfumes do not have a logo"); nor has Pine.
 */
export declare const FACILITY_BRANDS: Record<FacilityKey, FacilityBrand>;
/**
 * Which strip a facility gets: the first of `places` (say the branch, then the entity) that
 * names one. A name that matches none gets HiFive Holdings' strip and mark, so colour and mark
 * agree (proposed 15 Nov 2026; Recruitment used Atomic's colours there).
 */
export declare function facilityKey(...places: (string | null | undefined)[]): FacilityKey;
export interface MarkBox {
    /** The logo's `updated_at` in HiFive ID when the box was measured. */
    v: string;
    /** The lockup's size, then the mark's box inside it, in the lockup's pixels. */
    W: number;
    H: number;
    x: number;
    y: number;
    w: number;
    h: number;
}
/** Measured from HiFive ID's lockups, 15 Nov 2026; exactly the mark, nothing beside it. */
export declare const MARK_BOXES: Record<string, MarkBox>;
/** One entry of HiFive ID's public `/logos` list (only what the check reads). */
export interface HifiveLogoEntry {
    key: string;
    variant?: string;
    updated_at?: string;
}
export interface FacilityMarkLook {
    /** The HiFive ID logo the mark is cut from. */
    logo: string;
    url: string;
    /** CSS for a box exactly the mark's size, its holder centring it: plain values, any framework. */
    style: Record<string, string>;
}
export interface MarkOptions {
    /** The square the mark sits in, px (40 on a strip). */
    size?: number;
    /** Room left on each side, px (5: the mark fitted in 30). */
    inset?: number;
    /** HiFive ID's `/logos` list, when the app has it: a logo replaced since it was measured is not drawn. */
    logos?: HifiveLogoEntry[];
}
/** The mark inside HiFive ID logo `logo`, or null when its box isn't known for this version. */
export declare function facilityMark(logo: string | null | undefined, { size, inset, logos }?: MarkOptions): FacilityMarkLook | null;
export interface FacilityStripLook {
    key: FacilityKey;
    /** The words: the name given, else the facility's own. */
    name: string;
    bg: string;
    fg: string;
    /** Its own mark; else the HiFive Holdings mark; null only when neither can be drawn. */
    mark: FacilityMarkLook | null;
}
export interface StripOptions extends MarkOptions {
    /** The branch, read before the facility's name for the colours; also picks a branch's logo. */
    branch?: string | null;
    /** A HiFive ID logo key the app already resolved (Recruitment's `logo.alt`), tried first. */
    logo?: string | null;
}
/** Everything a facility's strip shows. */
export declare function facilityStrip(facility: string | null | undefined, opts?: StripOptions): FacilityStripLook;
/** The strip across the top of a board card (`LaneCard.head`): the facility and, say, its REC ID. */
export declare function facilityHead(facility: string | null | undefined, aside?: string, opts?: {
    branch?: string | null;
    empty?: string;
}): {
    text: string;
    aside: string | undefined;
    bg: string;
    fg: string;
};
/** The initials a strip shows when no mark can be drawn. */
export declare function facilityInitials(name: string): string;
