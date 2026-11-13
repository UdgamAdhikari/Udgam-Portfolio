"use client";

import { useState, useTransition, type ReactNode } from "react";
import { isRedirectError } from "./redirect";
import { buttonClass } from "./ui";

type Result = { ok?: boolean; message?: string } | void;

/**
 * A button that runs one Server Action and reports what happened in a
 * polite live region. With `confirm`, the first press arms it and the second
 * press (within a few seconds) runs it.
 */
export default function ActionButton({
  action,
  children,
  confirm,
  className = buttonClass,
  pressed,
  label,
}: {
  action: () => Promise<Result>;
  children: ReactNode;
  confirm?: string;
  className?: string;
  pressed?: boolean;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [armed, setArmed] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = () => {
    if (confirm && !armed) {
      setArmed(true);
      window.setTimeout(() => setArmed(false), 5000);
      return;
    }
    setArmed(false);
    start(async () => {
      try {
        const result = await action();
        if (result?.message) setMessage({ ok: result.ok !== false, text: result.message });
        else if (result && result.ok === false) setMessage({ ok: false, text: "That didn't work." });
        else setMessage(null);
      } catch (error) {
        if (isRedirectError(error)) throw error;
        setMessage({ ok: false, text: "Something went wrong. Try again." });
      }
    });
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        aria-pressed={pressed}
        aria-label={label}
        aria-busy={pending || undefined}
        className={`${className} ${armed ? "border-signal! bg-signal! text-bg!" : ""}`}
      >
        {pending ? "Working…" : armed ? confirm : children}
      </button>
      <span role="status" className={`text-sm ${message?.ok === false ? "text-signal" : "text-muted"}`}>
        {message?.text}
      </span>
    </span>
  );
}
