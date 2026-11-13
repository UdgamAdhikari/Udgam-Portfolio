/**
 * Client side of the first-party analytics. Sends nothing when the visitor
 * has Global Privacy Control or Do Not Track on; the server checks too.
 */
export type TrackEvent = {
  type: "pageview" | "project_view" | "cv_download" | "outbound" | "contact_start";
  path?: string;
  target?: string;
};

export function trackingAllowed() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return !(nav.globalPrivacyControl === true || nav.doNotTrack === "1");
}

export function track(event: TrackEvent) {
  if (!trackingAllowed()) return;
  try {
    void fetch("/api/collect", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: event.type,
        path: event.path ?? location.pathname,
        target: event.target,
        referrer: event.type === "pageview" ? document.referrer || undefined : undefined,
      }),
    }).catch(() => {});
  } catch {
    // Analytics must never break the page.
  }
}
