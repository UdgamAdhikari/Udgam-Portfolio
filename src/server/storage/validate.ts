import { imageSize } from "image-size";

/**
 * Uploads are identified by their bytes, never by the file name or the
 * browser-supplied MIME type. SVG is refused outright: it can carry script.
 */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_SIDE = 8000;

export type Sniffed =
  | { kind: "image"; mime: "image/png" | "image/jpeg" | "image/webp" | "image/avif" | "image/gif"; ext: string }
  | { kind: "document"; mime: "application/pdf"; ext: "pdf" };

export function sniff(bytes: Uint8Array): Sniffed | null {
  const b = (i: number) => bytes[i] ?? -1;
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (b(0) === 0x89 && ascii(1, 4) === "PNG") return { kind: "image", mime: "image/png", ext: "png" };
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { kind: "image", mime: "image/jpeg", ext: "jpg" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { kind: "image", mime: "image/webp", ext: "webp" };
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return { kind: "image", mime: "image/avif", ext: "avif" };
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return { kind: "image", mime: "image/gif", ext: "gif" };
  if (ascii(0, 5) === "%PDF-") return { kind: "document", mime: "application/pdf", ext: "pdf" };
  return null;
}

export type ValidUpload = Sniffed & { size: number; width: number | null; height: number | null };

export function validateUpload(
  bytes: Uint8Array,
  expected: "image" | "document",
): { ok: true; file: ValidUpload } | { ok: false; error: string } {
  if (bytes.byteLength === 0) return { ok: false, error: "The file is empty." };
  const type = sniff(bytes);
  if (!type) return { ok: false, error: "Unsupported file. Use PNG, JPEG, WebP, AVIF or GIF images, or a PDF." };
  if (type.kind !== expected) {
    return { ok: false, error: expected === "image" ? "That isn't an image." : "That isn't a PDF." };
  }
  const max = type.kind === "image" ? IMAGE_MAX_BYTES : DOCUMENT_MAX_BYTES;
  if (bytes.byteLength > max) return { ok: false, error: `The file is larger than ${max / 1024 / 1024} MB.` };

  if (type.kind === "document") return { ok: true, file: { ...type, size: bytes.byteLength, width: null, height: null } };

  try {
    const { width, height } = imageSize(bytes);
    if (!width || !height) return { ok: false, error: "Couldn't read the image dimensions." };
    if (width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE) {
      return { ok: false, error: `Images can be at most ${MAX_IMAGE_SIDE}px on a side.` };
    }
    return { ok: true, file: { ...type, size: bytes.byteLength, width, height } };
  } catch {
    return { ok: false, error: "The image looks damaged and couldn't be read." };
  }
}

/** A display-safe version of an uploaded file's name. */
export const safeName = (name: string) =>
  name.normalize("NFKC").replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "file";
