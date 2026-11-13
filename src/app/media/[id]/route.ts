import { db } from "@/server/db/client";
import { readDbAsset } from "@/server/storage";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Serves uploads stored in Postgres. Ids are random and content is immutable. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const asset = await readDbAsset(db(), id);
  if (!asset?.data) return new Response("Not found", { status: 404 });

  const disposition = asset.kind === "document" ? `inline; filename="${asset.originalName.replace(/[^\w.\- ]/g, "_")}"` : "inline";
  return new Response(new Uint8Array(asset.data), {
    headers: {
      // The type was sniffed from the bytes at upload, never taken from the client.
      "Content-Type": asset.mime,
      "Content-Length": String(asset.size),
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${asset.sha256}"`,
    },
  });
}
