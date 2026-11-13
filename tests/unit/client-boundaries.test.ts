// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// A value exported from a "use client" file reaches Server Components as a
// client reference, not the value itself (`.map is not a function` at
// runtime). Shared constants belong in plain modules.
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("client module boundaries", () => {
  it('"use client" files export only components, hooks and types', () => {
    const offenders = files("src")
      .filter((f) => /^\s*["']use client["']/.test(readFileSync(f, "utf8")))
      .flatMap((f) =>
        [...readFileSync(f, "utf8").matchAll(/^export (?:const|let|var) (\w+)/gm)]
          .map((m) => m[1]!)
          // Components (PascalCase) and hooks are fine to export.
          .filter((name) => !/^[A-Z][a-z]/.test(name) && !/^use[A-Z]/.test(name))
          .map((name) => `${f}: ${name}`),
      );
    expect(offenders).toEqual([]);
  });
});
