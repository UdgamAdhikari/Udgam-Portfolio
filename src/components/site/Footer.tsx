import { sections, type Project } from "@/data/content";
import type { SiteProfile } from "@/server/content/site";
import { BackToTop, FooterClocks } from "./FooterMeta";

export default function Footer({
  home = true,
  profile,
  projects,
}: {
  home?: boolean;
  profile: SiteProfile;
  projects: Pick<Project, "slug" | "title" | "featured">[];
}) {
  const columns = [
    {
      title: "Menu",
      links: sections.map((s) => ({ label: s.label, href: home ? `#${s.id}` : `/#${s.id}` })),
    },
    {
      title: "Socials",
      links: [
        ...profile.social.map((s) => ({ label: s.label, href: s.href, external: true })),
        { label: "Email", href: `mailto:${profile.email}` },
      ],
    },
    {
      title: "Case studies",
      links: [
        ...projects.filter((p) => p.featured).map((p) => ({ label: p.title, href: `/work/${p.slug}` })),
      ],
    },
  ];

  return (
    <footer className="px-4 pt-16 pb-10 sm:px-8 lg:px-12 lg:pt-20">
      <div className="grid gap-10 sm:grid-cols-3 lg:grid-cols-12 lg:gap-6">
        {columns.map((column, i) => (
          <nav key={column.title} aria-label={column.title} className={i === 0 ? "lg:col-span-6" : "lg:col-span-3"}>
            <h2 className="border-b border-fg/50 pb-2 text-2xl font-medium">{column.title}</h2>
            <ul className="mt-3 space-y-1 text-lg lowercase">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...("external" in link ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-20 grid items-center gap-10 lg:grid-cols-12 lg:gap-6">
        <p className="font-display text-[clamp(2.25rem,3.6vw,3.5rem)] leading-[1.02] font-[600] tracking-[-0.02em] lg:col-span-6">
          © {new Date().getFullYear()} {profile.name.split(" ")[0]}
          <br />
          All rights reserved<span className="text-signal">.</span>
        </p>
        <div className="lg:col-span-4">
          <FooterClocks firstName={profile.name.split(" ")[0]!} />
        </div>
        <div className="lg:col-span-2 lg:justify-self-end">
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
