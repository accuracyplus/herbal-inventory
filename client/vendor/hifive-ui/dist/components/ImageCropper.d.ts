import { type ReactNode } from 'react';
import { type Rect, type Corner, type CropOutput } from '../lib/crop';
/**
 * C22 · ImageCropper (Sinu, 16 Nov 2026: "add an option to crop photos wherever it is uploaded").
 * Every app that takes a photo shows the same cropper before it is sent.
 * - A fixed shape (`aspect`, 4:5 by default, the staff photo): drag the photo under the frame,
 *   pinch, scroll or slide to zoom.
 * - A free shape (`aspect={null}`, a delivery note or a document): drag the box's corners to
 *   choose what to keep, drag inside it to move it.
 * Both: turn a quarter at a time, reset, arrow keys move (and + / − zoom a fixed frame).
 * "Use this photo" gives the cropped picture, turned upright first: a File when a File was
 * picked (so it drops into an upload as it was), JPEG by default or the picked type with
 * output.type "original"; output.maxSide Infinity keeps every pixel of a free crop.
 * First built for the HiFive ID portal (hifive-id adb6b8e) and moved here.
 *
 * Crop only photos that are pictures (a staff photo, a welcome post), never photos that are
 * evidence or records (Logistics hashes each photo it keeps; a delivery note is kept with its
 * delivery): a crop changes the record. The one exception agreed so far is Logistics' odometer
 * photo, which is read for its number: use aspect={null}, output.type 'original' and
 * output.maxSide Infinity there, so nothing is squeezed.
 *
 * An app that passes `words` in another language checks the cropper itself at 320px: a tool that
 * walks the app's screens never opens this sheet (the Logistics chat's Malayalam "Use this
 * photo" overflowed while its own check passed; the buttons wrap since 0.36.1).
 */
export interface CropWords {
    title: string;
    hintFixed: string;
    hintFree: string;
    frame: string;
    zoom: string;
    zoomIn: string;
    zoomOut: string;
    turn: string;
    reset: string;
    cancel: string;
    use: string;
    unreadable: string;
    corner: Record<Corner, string>;
}
export declare const CROP_WORDS: CropWords;
export interface ImageCropperProps {
    open: boolean;
    /** The photo as picked (a File or Blob), or one already decoded. */
    image: Blob | ImageBitmap | null;
    /** Width ÷ height of the frame (4/5 for a portrait), or null for a free shape. Default 4/5. */
    aspect?: number | null;
    output?: CropOutput;
    title?: string;
    /** Labels in another language (Inventory's Malayalam); English otherwise. */
    words?: Partial<CropWords>;
    /** A fixed shape: drawn over the frame, not part of the picture (the welcome post's head-and-shoulders outline). */
    guide?: ReactNode;
    /** A fixed shape: how far down the photo (0–1) the frame starts; centred when absent. Recruitment uses 0.12. */
    startTop?: number;
    onCancel: () => void;
    /** The cropped picture: a File (named "<name>-cropped.<ext>") when a File was picked, else a Blob, with its type set. */
    onUse: (picture: Blob) => void;
}
/** Draw the chosen part of the photo at its output size and give it as a Blob of `type`. */
export declare function renderCrop(img: ImageBitmap, r: Rect, aspect: number | null, o?: CropOutput, original?: string): Promise<Blob | null>;
export declare function ImageCropper({ open, image, aspect, output, title, words, guide, startTop, onCancel, onUse }: ImageCropperProps): import("react").JSX.Element;
export interface CropImageOptions extends Omit<ImageCropperProps, 'open' | 'image' | 'onCancel' | 'onUse'> {
}
/**
 * Open the cropper for a picked file and wait: the cropped picture, or null if the person
 * cancels. For a page that does not draw the cropper itself:
 *   const picture = await cropImage(input.files[0], { aspect: null });
 */
export declare function cropImage(file: Blob, opts?: CropImageOptions): Promise<Blob | null>;
