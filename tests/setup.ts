import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  // Server tests run in the node environment, without a DOM.
  if (typeof document === "undefined") return;
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.motion;
});
