"use server";

import { revalidatePath } from "next/cache";
import { cancelBooking } from "@/server/booking";
import { requireAdmin } from "@/server/auth/guard";
import { db } from "@/server/db/client";
import { log } from "@/server/log";
import { isUuid, type ActionState } from "./shared";

export async function cancelBookingAction(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return { ok: false, message: "Invalid request." };
  const done = await cancelBooking(db(), id);
  if (done) log.info("booking.cancelled", { bookingId: id });
  revalidatePath("/admin/bookings");
  return done ? { ok: true, message: "Cancelled. The slot is open again; email them to let them know." } : { ok: false, message: "That booking is already cancelled." };
}
