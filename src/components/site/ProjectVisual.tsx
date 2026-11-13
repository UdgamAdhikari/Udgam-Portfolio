import Image from "next/image";
import {
  siCss,
  siHtml5,
  siPandas,
  siReactquery,
  siFirebase,
  siFlask,
  siJavascript,
  siNextdotjs,
  siPostman,
  siPython,
  siReact,
  siShadcnui,
  siTailwindcss,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";
import type { Project } from "@/data/content";

// Official marks (simple-icons, CC0) for the technologies projects list.
const ICONS: Record<string, SimpleIcon> = {
  React: siReact,
  "Context API": siReact,
  "Next.js": siNextdotjs,
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  "Tailwind CSS": siTailwindcss,
  "shadcn/ui": siShadcnui,
  Postman: siPostman,
  Flask: siFlask,
  Python: siPython,
  Firebase: siFirebase,
  Pandas: siPandas,
  HTML: siHtml5,
  CSS: siCss,
  "TanStack Query": siReactquery,
};

interface Props {
  project: Project;
  sizes: string;
  priority?: boolean;
  /** Logo size relative to the frame, e.g. "w-[18%]". */
  logoClassName?: string;
}

/**
 * The picture for a project: its real screenshot, or — when there isn't
 * one — the logos of what it was built with, printed in the page's ink.
 * Fills its parent; the parent decides the frame and aspect ratio.
 */
export default function ProjectVisual({ project, sizes, priority, logoClassName = "w-[clamp(3rem,16%,7rem)]" }: Props) {
  if (project.image) {
    return (
      <Image
        src={project.image.src}
        width={project.image.width}
        height={project.image.height}
        alt={`Screenshot of ${project.title}`}
        sizes={sizes}
        priority={priority}
        className="h-full w-full object-cover object-left-top"
        style={{ viewTransitionName: `shot-${project.slug}` }}
      />
    );
  }

  const icons = [...new Set(project.technologies.map((t) => ICONS[t]).filter((icon) => icon !== undefined))];

  return (
    <div
      role="img"
      aria-label={`${project.title}, built with ${icons.map((i) => i.title).join(", ") || "the listed tools"}`}
      className="grid h-full w-full place-items-center bg-[color-mix(in_srgb,var(--fg)_6%,var(--bg))] p-8"
      style={{ viewTransitionName: `shot-${project.slug}` }}
    >
      <ul className="flex w-full flex-wrap items-center justify-center gap-x-[8%] gap-y-8">
        {icons.map((icon) => (
          <li key={icon.slug} className={`flex flex-col items-center gap-3 ${logoClassName}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-full">
              <path d={icon.path} />
            </svg>
            <span className="label whitespace-nowrap text-muted">{icon.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
