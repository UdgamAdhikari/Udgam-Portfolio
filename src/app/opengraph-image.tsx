import { ImageResponse } from "next/og";
import { getSettings } from "@/server/content/public";

// The link preview is the hero, set as a printed card in the paper palette.
export const alt = "Portfolio preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const { hero, profile } = await getSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#ece9e2",
          color: "#1a1a19",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 3, color: "#5f5c56" }}>
          <span>{profile.name.toUpperCase()}</span>
          <span>{profile.role.toUpperCase()} · KATHMANDU</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 700, lineHeight: 0.9, letterSpacing: -5 }}>
            {hero.name[0]!.slice(0, -1)}
            <span style={{ color: "#d93f22" }}>.</span>
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 44, color: "#5f5c56" }}>{hero.tagline}</div>
        </div>
      </div>
    ),
    size,
  );
}
