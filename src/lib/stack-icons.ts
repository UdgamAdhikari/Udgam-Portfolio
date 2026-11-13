import {
  siCss,
  siDocker,
  siExpress,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siLinux,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siNpm,
  siPostgresql,
  siPostman,
  siReact,
  siShadcnui,
  siTailwindcss,
  siTypescript,
  siVercel,
  type SimpleIcon,
} from "simple-icons";

// Only the marks the stack uses are imported, so only these are bundled.
export const STACK_ICONS: Record<string, SimpleIcon> = Object.fromEntries(
  [
    siHtml5, siCss, siJavascript, siTypescript, siReact, siNextdotjs, siTailwindcss, siShadcnui, siNodedotjs,
    siExpress, siPostgresql, siMongodb, siDocker, siLinux, siGit, siGithub, siNpm, siVercel, siPostman,
  ].map((icon) => [icon.slug, icon]),
);
