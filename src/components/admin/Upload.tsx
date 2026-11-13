"use client";

import { useId, useState } from "react";
import { uploadAsset } from "@/app/admin/_actions/projects";
import type { StoredAsset } from "@/server/storage";
import { buttonClass } from "./ui";

/**
 * A file picker that uploads immediately through the uploadAsset action
 * (validated server-side by content, not by name) and hands back the
 * stored asset. Errors are shown inline.
 */
export default function Upload({
  kind,
  label,
  onUploaded,
}: {
  kind: "image" | "document";
  label: string;
  onUploaded: (asset: StoredAsset) => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      const result = await uploadAsset(form);
      if (result.ok) onUploaded(result.asset);
      else setError(result.message);
    } catch {
      setError("The upload failed. Check the file size (images ≤ 5 MB, PDFs ≤ 8 MB) and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label htmlFor={id} className={`${buttonClass} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-signal ${busy ? "opacity-50" : ""}`}>
        {busy ? "Uploading…" : label}
        <input
          id={id}
          type="file"
          className="sr-only"
          disabled={busy}
          accept={kind === "image" ? "image/png,image/jpeg,image/webp,image/avif,image/gif" : "application/pdf"}
          onChange={onChange}
        />
      </label>
      <p role="status" className="mt-1 text-sm text-signal">
        {error}
      </p>
    </div>
  );
}
