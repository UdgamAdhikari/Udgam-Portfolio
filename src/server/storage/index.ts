import "server-only";
import { AwsClient } from "aws4fetch";
import { eq } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import { assets, type AssetRow } from "@/server/db/schema";
import { env } from "@/server/env";
import { sha256 } from "@/server/security/crypto";
import { safeName, validateUpload } from "./validate";

export type StoredAsset = { id: string; url: string; width: number | null; height: number | null; mime: string; name: string };

/**
 * Two drivers behind one call:
 *  - "db" (default): bytes in Postgres, served by /media/[id]. Zero extra
 *    services; fine for a portfolio's few dozen images.
 *  - "s3": any S3-compatible bucket (AWS S3, Cloudflare R2, MinIO), served
 *    from S3_PUBLIC_URL.
 */
export async function storeUpload(
  db: Db,
  file: File,
  expected: "image" | "document",
): Promise<{ ok: true; asset: StoredAsset } | { ok: false; error: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload(bytes, expected);
  if (!check.ok) return check;
  const { mime, ext, size, width, height, kind } = check.file;
  const hash = sha256(Buffer.from(bytes));
  const name = safeName(file.name);

  const config = env();
  let objectKey: string | null = null;
  if (config.STORAGE_DRIVER === "s3") {
    objectKey = `uploads/${hash.slice(0, 2)}/${hash}.${ext}`;
    const client = new AwsClient({
      accessKeyId: config.S3_ACCESS_KEY_ID!,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY!,
      region: config.S3_REGION,
      service: "s3",
    });
    const res = await client.fetch(`${config.S3_ENDPOINT!.replace(/\/$/, "")}/${config.S3_BUCKET}/${objectKey}`, {
      method: "PUT",
      body: bytes,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(kind === "document" ? { "Content-Disposition": `inline; filename="${name.replace(/"/g, "")}"` } : {}),
      },
    });
    if (!res.ok) return { ok: false, error: `Storage rejected the upload (${res.status}).` };
  }

  const [row] = await db
    .insert(assets)
    .values({
      kind,
      mime,
      size,
      width,
      height,
      sha256: hash,
      originalName: name,
      storage: config.STORAGE_DRIVER,
      objectKey,
      data: config.STORAGE_DRIVER === "db" ? Buffer.from(bytes) : null,
    })
    .returning({ id: assets.id });

  return { ok: true, asset: { id: row!.id, url: assetUrl({ id: row!.id, storage: config.STORAGE_DRIVER, objectKey }), width, height, mime, name } };
}

export function assetUrl(asset: Pick<AssetRow, "id" | "storage" | "objectKey">) {
  if (asset.storage === "s3" && asset.objectKey) return `${env().S3_PUBLIC_URL!.replace(/\/$/, "")}/${asset.objectKey}`;
  return `/media/${asset.id}`;
}

export async function readDbAsset(db: Db, id: string) {
  const [row] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  return row ?? null;
}
