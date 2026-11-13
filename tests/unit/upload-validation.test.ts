// @vitest-environment node
import { describe, expect, it } from "vitest";
import { safeName, sniff, validateUpload } from "@/server/storage/validate";

// A real 1×1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

describe("upload validation", () => {
  it("identifies images by their bytes and reads dimensions", () => {
    const result = validateUpload(PNG, "image");
    expect(result).toEqual({ ok: true, file: { kind: "image", mime: "image/png", ext: "png", size: PNG.length, width: 1, height: 1 } });
  });

  it("refuses SVG (it can contain script) and HTML disguised as an image", () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(validateUpload(svg, "image")).toMatchObject({ ok: false });
    expect(validateUpload(Buffer.from("<html><script>alert(1)</script>"), "image")).toMatchObject({ ok: false });
  });

  it("refuses a PDF where an image is expected, and vice versa", () => {
    expect(validateUpload(Buffer.from("%PDF-1.7\n..."), "image")).toMatchObject({ ok: false, error: "That isn't an image." });
    expect(validateUpload(PNG, "document")).toMatchObject({ ok: false, error: "That isn't a PDF." });
    expect(validateUpload(Buffer.from("%PDF-1.7\n..."), "document")).toMatchObject({ ok: true });
  });

  it("refuses truncated images, empty files and oversized files", () => {
    expect(validateUpload(PNG.subarray(0, 12), "image")).toMatchObject({ ok: false });
    expect(validateUpload(new Uint8Array(), "image")).toMatchObject({ ok: false, error: "The file is empty." });
    const big = Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]);
    expect(validateUpload(big, "image")).toMatchObject({ ok: false });
  });

  it("sniffs JPEG, WebP and GIF signatures", () => {
    expect(sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(sniff(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))?.mime).toBe("image/webp");
    expect(sniff(Buffer.from("GIF89a"))?.mime).toBe("image/gif");
  });

  it("makes file names safe to display", () => {
    expect(safeName('../../etc/passwd"<script>.png')).toBe(".._.._etc_passwd_script_.png");
    expect(safeName("")).toBe("file");
  });
});
