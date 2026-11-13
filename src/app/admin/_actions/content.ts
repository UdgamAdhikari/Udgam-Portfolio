"use server";

import { revalidatePath } from "next/cache";
import { SETTINGS, type SettingKey } from "@/lib/content-schema";
import { requireAdmin } from "@/server/auth/guard";
import { deleteExperience, moveExperience, saveExperience } from "@/server/admin/experience";
import { writeSetting } from "@/server/content/repo";
import { db } from "@/server/db/client";
import { isUuid, payload, refreshPublic, type ActionState } from "./shared";

export async function saveSettingAction(key: SettingKey, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!(key in SETTINGS)) return { ok: false, message: "Unknown section." };
  const parsed = SETTINGS[key].safeParse(payload(formData));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: "Some fields need attention.", fields };
  }
  await writeSetting(db(), key, parsed.data);
  refreshPublic("settings");
  revalidatePath("/admin/content");
  return { ok: true, message: "Saved — the live site is updated." };
}

export async function saveExperienceAction(id: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (id !== null && !isUuid(id)) return { ok: false, message: "Invalid request." };
  const result = await saveExperience(db(), id, payload(formData));
  if (!result.ok) return result;
  refreshPublic("experience");
  revalidatePath("/admin/content");
  return { ok: true, message: "Saved.", id: result.id };
}

export async function moveExperienceAction(id: string, direction: -1 | 1): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id) || (direction !== -1 && direction !== 1)) return { ok: false, message: "Invalid request." };
  await moveExperience(db(), id, direction);
  refreshPublic("experience");
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function deleteExperienceAction(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return { ok: false, message: "Invalid request." };
  await deleteExperience(db(), id);
  refreshPublic("experience");
  revalidatePath("/admin/content");
  return { ok: true, message: "Deleted." };
}
