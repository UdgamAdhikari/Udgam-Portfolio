"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/guard";
import { deleteProject, moveProject, saveProject, setFeatured, setPublished } from "@/server/admin/projects";
import { getProject } from "@/server/content/repo";
import { db } from "@/server/db/client";
import { storeUpload, type StoredAsset } from "@/server/storage";
import { isUuid, payload, refreshPublic, type ActionState } from "./shared";

export async function saveProjectAction(id: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (id !== null && !isUuid(id)) return { ok: false, message: "Invalid request." };
  const before = id ? await getProject(db(), id) : null;
  const result = await saveProject(db(), id, payload(formData));
  if (!result.ok) return { ok: false, message: result.message, fields: result.fields };
  const after = await getProject(db(), result.id);
  if (after?.published || before?.published) refreshPublic("projects", [before?.slug, after?.slug].filter(Boolean) as string[]);
  revalidatePath("/admin/projects", "layout");
  if (!id) redirect(`/admin/projects/${result.id}?created=1`);
  return { ok: true, message: after?.published ? "Saved — the live site is updated." : "Saved as a draft.", id: result.id };
}

export async function publishProject(id: string, published: boolean): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return { ok: false, message: "Invalid request." };
  const row = await setPublished(db(), id, published);
  if (!row) return { ok: false, message: "That project no longer exists." };
  refreshPublic("projects", [row.slug]);
  revalidatePath("/admin/projects", "layout");
  return { ok: true, message: published ? "Published." : "Unpublished — it's no longer on the site." };
}

export async function featureProject(id: string, featured: boolean): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return { ok: false, message: "Invalid request." };
  const row = await setFeatured(db(), id, featured);
  if (!row) return { ok: false, message: "That project no longer exists." };
  refreshPublic("projects", [row.slug]);
  revalidatePath("/admin/projects", "layout");
  return { ok: true };
}

export async function moveProjectAction(id: string, direction: -1 | 1): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id) || (direction !== -1 && direction !== 1)) return { ok: false, message: "Invalid request." };
  await moveProject(db(), id, direction);
  refreshPublic("projects");
  revalidatePath("/admin/projects");
  return { ok: true };
}

export async function deleteProjectAction(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return { ok: false, message: "Invalid request." };
  const row = await deleteProject(db(), id);
  if (row) refreshPublic("projects", [row.slug]);
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

/** Upload one file; returns where it's served from and its dimensions. */
export async function uploadAsset(
  formData: FormData,
): Promise<{ ok: true; asset: StoredAsset } | { ok: false; message: string }> {
  await requireAdmin();
  const file = formData.get("file");
  const kind = formData.get("kind") === "document" ? "document" : "image";
  if (!(file instanceof File)) return { ok: false, message: "Choose a file to upload." };
  const result = await storeUpload(db(), file, kind);
  return result.ok ? result : { ok: false, message: result.error };
}
