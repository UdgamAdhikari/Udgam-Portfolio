import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Download, Github, Linkedin, Mail } from "lucide-react";
import { profile } from "../data/content";
import Magnetic from "./Magnetic";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.33, 1, 0.68, 1] as const },
});

export default function Hero() {
  const go = (href: string) =>
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      {/* soft accent glow behind the headline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]"
      />

      <motion.div {...fade(0.05)}>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Available for work
        </span>
      </motion.div>

      <motion.p
        {...fade(0.15)}
        className="mb-6 mt-8 font-display text-xs font-medium uppercase tracking-[0.4em] text-accent sm:text-sm"
      >
        {profile.role} · {profile.location}
      </motion.p>

      <motion.h1
        {...fade(0.25)}
        className="font-display text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-7xl lg:text-8xl"
      >
        Hi, I'm{" "}
        <span className="bg-gradient-to-r from-accent via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
          {profile.name}
        </span>
      </motion.h1>

      <motion.p
        {...fade(0.4)}
        className="mt-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-xl"
      >
        {profile.tagline}
      </motion.p>

      <motion.div {...fade(0.55)} className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Magnetic>
          <button
            onClick={() => go("#projects")}
            className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-ink shadow-lg shadow-white/5 transition-all duration-300 hover:bg-accent hover:text-white hover:shadow-accent/30"
          >
            View Projects
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </Magnetic>
        <Magnetic>
          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-8 py-4 font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-accent/60 hover:bg-accent/10 hover:text-accent"
          >
            <Download
              size={18}
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
            Download Resume
          </a>
        </Magnetic>
      </motion.div>

      <motion.div {...fade(0.7)} className="mt-12 flex items-center gap-3">
        {[
          { icon: <Github size={20} />, href: profile.social.github, label: "GitHub" },
          { icon: <Linkedin size={20} />, href: profile.social.linkedin, label: "LinkedIn" },
          { icon: <Mail size={20} />, href: `mailto:${profile.email}`, label: "Email" },
        ].map((s) => (
          <a
            key={s.label}
            href={s.href}
            target={s.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            aria-label={s.label}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:text-accent"
          >
            {s.icon}
          </a>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        onClick={() => go("#about")}
        aria-label="Scroll to about section"
        className="absolute bottom-8 animate-bounce text-white/30 transition-colors hover:text-accent"
      >
        <ArrowDown size={22} />
      </motion.button>
    </section>
  );
}
