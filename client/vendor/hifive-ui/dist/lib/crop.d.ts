/**
 * Cropping a photo before it is sent (Sinu, 16 Nov 2026: "add an option to crop photos wherever
 * it is uploaded"). The arithmetic only, no React and no canvas, so it is tested on its own.
 *
 * Two shapes:
 * - A fixed shape (a portrait, 4:5): the photo moves and zooms under a fixed frame. View state is
 *   `zoom` (1 = the photo just covers the frame) and the frame's centre in photo pixels. First
 *   written for the HiFive ID portal's staff photo (hifive-id adb6b8e) and moved here unchanged.
 * - A free shape (a delivery note, a document): the photo stays still and a box with corner
 *   handles chooses what to keep. State is the box in photo pixels.
 */
export interface CropView {
    zoom: number;
    cx: number;
    cy: number;
}
export interface Rect {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
}
export declare const MIN_ZOOM = 1;
export declare const MAX_ZOOM = 4;
/** The largest frame-shaped area of the photo, at zoom 1. */
export declare function coverSize(imgW: number, imgH: number, aspect: number): {
    w: number;
    h: number;
};
/** Keep the frame inside the photo: the centre moves, never the zoom. */
export declare function clampView(v: CropView, imgW: number, imgH: number, aspect: number): CropView;
/**
 * The starting view: the whole frame filled, centred. With `aspect` and `top` (0–1), the frame
 * starts that far down the photo instead, so a portrait opens on the face (Recruitment's welcome
 * post starts at 0.12); kept inside the photo.
 */
export declare function initialView(imgW: number, imgH: number, aspect?: number, top?: number): CropView;
/** The part of the photo inside the frame, in photo pixels. */
export declare function cropRect(v: CropView, imgW: number, imgH: number, aspect: number): Rect;
/** A drag of (dx, dy) screen pixels on a frame drawn `frameW` wide: the photo follows the finger. */
export declare function dragView(v: CropView, dx: number, dy: number, frameW: number, imgW: number, imgH: number, aspect: number): CropView;
/** Zoom to `zoom`, keeping the centre where it is (then kept inside the photo). */
export declare function zoomView(v: CropView, zoom: number, imgW: number, imgH: number, aspect: number): CropView;
export type Corner = 'nw' | 'ne' | 'sw' | 'se';
/** The smallest box, in photo pixels: a tenth of the shorter side, at least 24 px. */
export declare const minBox: (imgW: number, imgH: number) => number;
/** The starting box: the whole photo. */
export declare function initialBox(imgW: number, imgH: number): Rect;
/** Keep a box inside the photo and no smaller than the smallest box. */
export declare function clampBox(b: Rect, imgW: number, imgH: number): Rect;
/** Move the whole box by (dx, dy) photo pixels; it stops at the photo's edges and keeps its size. */
export declare function moveBox(b: Rect, dx: number, dy: number, imgW: number, imgH: number): Rect;
/** Drag one corner by (dx, dy) photo pixels; the opposite corner stays where it is. */
export declare function resizeBox(b: Rect, corner: Corner, dx: number, dy: number, imgW: number, imgH: number): Rect;
/** Where a photo of imgW × imgH sits, fitted whole inside a box of boxW × boxH (screen pixels). */
export declare function fitInside(imgW: number, imgH: number, boxW: number, boxH: number): {
    x: number;
    y: number;
    w: number;
    h: number;
    scale: number;
};
export interface CropOutput {
    /** A fixed shape: the picture's width (its height follows the shape). Default 800. */
    width?: number;
    /** A free shape: the longest side at most this. Default 1600; Infinity keeps every pixel of the crop. */
    maxSide?: number;
    /** Default 'image/jpeg'. 'original' keeps the picked file's type (PNG stays PNG, JPEG stays JPEG). */
    type?: string;
    /** For JPEG and WebP. Default 0.92. */
    quality?: number;
}
/** The type the cropped picture is written as: a browser can write PNG, JPEG and WebP. */
export declare function outputType(want: string | undefined, original: string | undefined): string;
/** The cropped file's name: "meter.jpg" becomes "meter-cropped.jpg", with the extension for its type. */
export declare function croppedName(name: string | undefined, type: string): string;
/** The size of the picture sent for a crop of sw × sh. */
export declare function outputSize(sw: number, sh: number, aspect: number | null, o?: CropOutput): {
    width: number;
    height: number;
};
