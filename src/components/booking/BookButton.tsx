"use client";

import type { ReactNode } from "react";
import { openBooking } from "@/lib/booking-events";

/** Any button that opens the call-booking dialog. */
export default function BookButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={openBooking} aria-haspopup="dialog" className={className}>
      {children}
    </button>
  );
}
