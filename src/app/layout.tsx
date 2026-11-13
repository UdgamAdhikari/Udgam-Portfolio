import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { getSettings } from "@/server/content/public";
import Analytics from "@/components/content/Analytics";
import { bootScript } from "@/lib/controls-boot";
import BlueprintMode from "@/components/site/BlueprintMode";
import "./globals.css";

// Archivo is loaded as a variable font with its width axis: the headline is
// fitted to its column by changing width, not size.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { profile, seo } = await getSettings();
  return {
    metadataBase: new URL(profile.website),
    title: seo.title,
    description: seo.description,
    authors: [{ name: profile.name, url: profile.website }],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      title: seo.title,
      description: seo.description,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ECE9E2" },
    { media: "(prefers-color-scheme: dark)", color: "#161615" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="paper"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      {/* Extensions (e.g. ColorZilla) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>
        {children}
        <BlueprintMode />
        <Analytics />
      </body>
    </html>
  );
}
