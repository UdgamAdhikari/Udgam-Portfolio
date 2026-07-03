import { profile } from "../data/content";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-white/35 sm:flex-row">
        <span className="font-display font-bold text-white">
          UA<span className="text-accent">.</span>
        </span>
        <span>
          © {new Date().getFullYear()} {profile.name}. Built with React, Three.js & GSAP.
        </span>
        <a
          href={`mailto:${profile.email}`}
          className="transition-colors hover:text-accent"
        >
          {profile.email}
        </a>
      </div>
    </footer>
  );
}
