import type { ReactNode } from "react";

/**
 * A visible placeholder for facts that haven't been confirmed yet. It is
 * deliberately loud: unconfirmed content should never pass as finished.
 */
export default function Pending({ children = "To confirm" }: { children?: ReactNode }) {
  return (
    <span
      data-pending
      className="label inline-block border border-dashed border-signal px-1.5 py-0.5 align-middle text-signal"
    >
      {children}
    </span>
  );
}
