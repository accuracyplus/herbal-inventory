/**
 * A tone is one of the palette's three data colours or a fixed status
 * colour. Components take a tone name and the CSS resolves it through the
 * .hf-tone-* classes, so nothing here is a hex value and a palette change
 * reaches every component at once.
 *
 * brand / pop / sky follow the skin. ok / warn / danger / coral do not
 * (Design Guide Part B): a status colour means the same in every palette.
 */
export type Tone = 'brand' | 'pop' | 'sky' | 'coral' | 'ok' | 'warn' | 'danger';
export declare const toneClass: (t: Tone) => string;
export declare const cx: (...parts: (string | false | null | undefined)[]) => string;
