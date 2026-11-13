"use client";

import { removeInquiry, retryInquiryNotification, updateInquiryStatus } from "@/app/admin/_actions/inquiries";
import ActionButton from "./ActionButton";
import { buttonClass, primaryButtonClass } from "./ui";

const STATUSES = ["new", "read", "replied", "archived"] as const;

export function StatusButtons({ id, status }: { id: string; status: string }) {
  return (
    <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
      {STATUSES.map((s) => (
        <ActionButton
          key={s}
          action={() => updateInquiryStatus(id, s)}
          pressed={status === s}
          className={status === s ? primaryButtonClass : buttonClass}
        >
          {s === "replied" ? "Mark replied" : s[0]!.toUpperCase() + s.slice(1)}
        </ActionButton>
      ))}
    </div>
  );
}

export function RetryNotification({ id }: { id: string }) {
  return <ActionButton action={() => retryInquiryNotification(id)}>Retry notification email</ActionButton>;
}

export function DeleteInquiry({ id }: { id: string }) {
  return (
    <ActionButton action={() => removeInquiry(id)} confirm="Press again to delete permanently">
      Delete inquiry
    </ActionButton>
  );
}
