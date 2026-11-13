import ActionButton from "@/components/admin/ActionButton";
import { DateTime, EmptyState, PageHeader, Pill, quietButtonClass } from "@/components/admin/ui";
import { BOOKING } from "@/lib/booking";
import { listBookings } from "@/server/booking";
import { requireAdminPage } from "@/server/auth/guard";
import { db } from "@/server/db/client";
import type { Booking } from "@/server/db/schema";
import { cancelBookingAction } from "../../_actions/bookings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings" };

function BookingRow({ booking, past }: { booking: Booking; past?: boolean }) {
  const cancelled = booking.status === "cancelled";
  return (
    <li className={`grid gap-3 border-t border-line py-5 sm:grid-cols-[14rem_1fr_auto] sm:items-start ${cancelled ? "opacity-60" : ""}`}>
      <div>
        <p className="text-lg">
          <DateTime value={booking.startsAt} />
        </p>
        <p className="label mt-1 text-muted">Kathmandu time · {BOOKING.minutes} min</p>
      </div>
      <div>
        <p>
          {booking.name} ·{" "}
          <a href={`mailto:${booking.email}?subject=${encodeURIComponent(`Our call on ${booking.startsAt.toDateString()}`)}`} className="underline underline-offset-4">
            {booking.email}
          </a>
        </p>
        {booking.notes && <p className="mt-2 whitespace-pre-line text-muted">{booking.notes}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone={cancelled ? "archived" : "new"}>{booking.status}</Pill>
          <Pill tone={booking.notification}>{booking.notification === "sent" ? "email sent" : booking.notification === "failed" ? "no email sent" : "email pending"}</Pill>
          <span className="label text-muted">Ref {booking.id.slice(0, 8)}</span>
        </div>
      </div>
      {!cancelled && !past && (
        <ActionButton action={cancelBookingAction.bind(null, booking.id)} confirm="Press again to cancel" className={quietButtonClass}>
          Cancel
        </ActionButton>
      )}
    </li>
  );
}

export default async function BookingsPage() {
  await requireAdminPage();
  const [upcoming, past] = await Promise.all([listBookings(db(), { upcoming: true }), listBookings(db(), { upcoming: false })]);
  const confirmed = upcoming.filter((b) => b.status === "confirmed").length;

  return (
    <>
      <PageHeader title="Bookings" eyebrow={`${confirmed} upcoming call${confirmed === 1 ? "" : "s"}`} />
      <p className="mb-8 max-w-[60ch] text-muted">
        Calls booked from the &ldquo;Get in touch&rdquo; button. Reply to each person with a meeting link. Availability is set in{" "}
        <code className="font-mono text-sm">src/lib/booking.ts</code>.
      </p>

      <h2 className="label mb-2 text-muted">Upcoming</h2>
      {upcoming.length === 0 ? (
        <EmptyState title="No upcoming calls">New bookings appear here as soon as they&apos;re made.</EmptyState>
      ) : (
        <ul>
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <h2 className="label mt-12 mb-2 text-muted">Past</h2>
          <ul>
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} past />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
