"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Page views plus two interactions worth knowing about: CV downloads and
 * outbound links. Cookieless, and silent under GPC / Do Not Track (see
 * src/lib/analytics.ts). Nothing is tracked inside the dashboard.
 */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    track({ type: "pageview", path: pathname });
    const project = /^\/work\/([a-z0-9-]+)$/.exec(pathname);
    if (project) track({ type: "project_view", path: pathname, target: project[1] });
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (location.pathname.startsWith("/admin")) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.pathname === "/resume" || url.pathname.endsWith(".pdf")) {
        track({ type: "cv_download", target: url.pathname });
      } else if (url.origin !== location.origin && /^https?:$/.test(url.protocol)) {
        track({ type: "outbound", target: url.hostname });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
