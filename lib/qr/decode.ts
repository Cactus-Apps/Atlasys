import BinaryBitmap from "@zxing/library/cjs/core/BinaryBitmap";
import HybridBinarizer from "@zxing/library/cjs/core/common/HybridBinarizer";
import RGBLuminanceSource from "@zxing/library/cjs/core/RGBLuminanceSource";
import QRCodeReader from "@zxing/library/cjs/core/qrcode/QRCodeReader";

/**
 * QR decoding on the camera frame worklet.
 *
 * This replaces `expo-camera`'s `onBarcodeScanned`, whose Android build pulls
 * in `com.google.android.gms:play-services-code-scanner` and MLKit. ZXing is
 * Apache-2.0, pure JavaScript and needs no Play Services, so the decode runs
 * directly on the frame worklet with the luminance plane of the YUV frame.
 *
 * Only the QR reader is imported (deep imports instead of the package root) so
 * the bundle does not drag in every other barcode format ZXing supports.
 */

/** Region of the frame to decode, as a fraction of the frame size. */
export type ScanRegion = {
  /** 0..1, relative to frame width. */
  x: number;
  y: number;
  width: number;
  height: number;
};

let reader: QRCodeReader | null = null;

function getReader(): QRCodeReader {
  // Reuse across frames: constructing the reader allocates every internal
  // lookup table, and worklet module scope persists between frames.
  if (reader == null) {
    reader = new QRCodeReader();
  }
  return reader;
}

function releaseReader(): void {
  reader = null;
}

/**
 * Camera frames are padded to `bytesPerRow`, but ZXing expects tightly packed
 * rows. Only repack when the stride actually differs.
 */
function toPackedLuma(
  luma: Uint8ClampedArray,
  width: number,
  height: number,
  bytesPerRow: number,
): Uint8ClampedArray {
  if (bytesPerRow === width) {
    return luma;
  }
  const packed = new Uint8ClampedArray(width * height);
  for (let row = 0; row < height; row++) {
    const from = row * bytesPerRow;
    packed.set(luma.subarray(from, from + width), row * width);
  }
  return packed;
}

function crop(
  luma: Uint8ClampedArray,
  width: number,
  height: number,
  region: ScanRegion,
): Uint8ClampedArray {
  const left = Math.max(0, Math.floor(region.x * width));
  const top = Math.max(0, Math.floor(region.y * height));
  const cropWidth = Math.min(
    width - left,
    Math.max(1, Math.floor(region.width * width)),
  );
  const cropHeight = Math.min(
    height - top,
    Math.max(1, Math.floor(region.height * height)),
  );

  const out = new Uint8ClampedArray(cropWidth * cropHeight);
  for (let row = 0; row < cropHeight; row++) {
    const from = (top + row) * width + left;
    out.set(luma.subarray(from, from + cropWidth), row * cropWidth);
  }
  return out;
}

/**
 * Decodes the first QR code found in a luminance plane.
 *
 * Returns `null` when no readable code is in the frame, which is the normal
 * case for most frames. Never throws: ZXing signals "not found" via an
 * exception and this runs per frame on the worklet thread.
 */
export function decodeQrFromLuma(
  lumaBuffer: ArrayBuffer,
  width: number,
  height: number,
  bytesPerRow: number,
  region?: ScanRegion,
): string | null {
  try {
    if (width <= 0 || height <= 0) {
      return null;
    }

    const raw = new Uint8ClampedArray(lumaBuffer);
    const needed = bytesPerRow * height;
    if (raw.length < needed) {
      return null;
    }

    const usable =
      bytesPerRow === width
        ? raw
        : toPackedLuma(raw, width, height, bytesPerRow);

    const luminance = region
      ? crop(usable, width, height, region)
      : usable;
    const luminanceWidth = region
      ? Math.min(
          width,
          Math.max(1, Math.floor(region.width * width)),
        )
      : width;
    const luminanceHeight = region
      ? Math.min(
          height,
          Math.max(1, Math.floor(region.height * height)),
        )
      : height;

    const source = new RGBLuminanceSource(
      luminance,
      luminanceWidth,
      luminanceHeight,
    );
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));

    const result = getReader().decode(bitmap);
    const text = result?.getText();
    return text != null && text.length > 0 ? text : null;
  } catch {
    // NotFoundException / ChecksumException / FormatException all land here.
    return null;
  }
}

/**
 * Frees the cached reader. Call from the JS thread when the scanner unmounts so
 * the worklet runtime does not hold the lookup tables alive.
 */
export function releaseQrDecoder(): void {
  releaseReader();
}