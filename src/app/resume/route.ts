import { redirect } from "next/navigation";
import { getSettings } from "@/server/content/public";

/** A stable link to whichever CV is current; the file itself can change. */
export async function GET() {
  const { resume } = await getSettings();
  redirect(resume.url);
}
