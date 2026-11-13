import { useSyncExternalStore } from "react";

const format = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  hour: "2-digit",
  minute: "2-digit",
});

let now = "";
const listeners = new Set<() => void>();
let timer: number | undefined;

function tick() {
  now = format.format(new Date());
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    tick();
    timer = window.setInterval(tick, 15_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.clearInterval(timer);
  };
}

/** Local time in Kathmandu ("14:05"), or "" during server render. */
export function useKathmanduTime() {
  return useSyncExternalStore(subscribe, () => now, () => "");
}
