/**
 * Reads a barcode from a video frame (or a canvas).
 *
 * The browser's own BarcodeDetector where there is one (Android Chrome). Elsewhere — every
 * iPhone, and desktop Chrome on Windows — the ZXing decoder, bundled with the app and loaded only
 * when needed: the page may load scripts from itself alone (CSP), so nothing comes from a CDN.
 */

const NATIVE = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'codabar', 'qr_code', 'data_matrix'];
const ZXING = ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128', 'CODE_39', 'CODE_93', 'ITF', 'CODABAR', 'QR_CODE', 'DATA_MATRIX'];

let made = null;

/** One reader for the page: { kind: 'native' | 'zxing', read(source) → text or null }. */
export function makeReader() {
  if (!made) made = build().catch((e) => { made = null; throw e; });
  return made;
}

// The local test copy only (test/serve.mjs): lets a check feed the reader a picture. Removed from
// any other build, because MODE is fixed when the app is built.
if (import.meta.env.MODE === 'localtest' && typeof window !== 'undefined') {
  window.__hifiveReadPicture = async (canvas) => {
    const r = await makeReader();
    return { kind: r.kind, text: await r.read(canvas) };
  };
}

async function build() {
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const formats = NATIVE.filter((f) => supported.includes(f));
      if (formats.length) {
        const detector = new window.BarcodeDetector({ formats });
        return { kind: 'native', read: async (src) => (await detector.detect(src))[0]?.rawValue || null };
      }
    } catch { /* the bundled reader below */ }
  }
  const z = await import('@zxing/library');
  const reader = new z.MultiFormatReader();
  reader.setHints(new Map([
    [z.DecodeHintType.TRY_HARDER, true],
    [z.DecodeHintType.POSSIBLE_FORMATS, ZXING.map((f) => z.BarcodeFormat[f]).filter((f) => f !== undefined)],
  ]));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return {
    kind: 'zxing',
    read: async (src) => {
      const w0 = src.videoWidth || src.width;
      const h0 = src.videoHeight || src.height;
      if (!w0 || !h0) return null;
      // A phone frame is far bigger than a barcode needs; smaller is faster on an old phone.
      const k = Math.min(1, 960 / Math.max(w0, h0));
      const w = Math.round(w0 * k);
      const h = Math.round(h0 * k);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(src, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const grey = new Uint8ClampedArray(w * h);
      for (let i = 0, j = 0; j < grey.length; i += 4, j += 1) grey[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      try {
        return reader.decodeWithState(new z.BinaryBitmap(new z.HybridBinarizer(new z.RGBLuminanceSource(grey, w, h)))).getText();
      } catch {
        return null; // nothing in this frame
      }
    },
  };
}
