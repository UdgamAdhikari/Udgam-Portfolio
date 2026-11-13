"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/_actions/auth";
import type { ActionState } from "@/app/admin/_actions/shared";
import { inputClass, primaryButtonClass } from "./ui";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(login, {});
  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="label text-muted">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required spellCheck={false} className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="label text-muted">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      {state.message && (
        <p role="alert" className="rounded-lg border border-signal px-3 py-2 text-sm text-signal">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
