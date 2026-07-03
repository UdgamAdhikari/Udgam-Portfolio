import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { projects, Project } from "../data/content";
import SectionHeading from "./SectionHeading";
import { isTouchDevice, prefersReducedMotion } from "../lib/motion";

// Featured card with 3D hover tilt
function TiltCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 20 });
  const sry = useSpring(ry, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(srx, (v) => `${v}deg`);
  const rotateY = useTransform(sry, (v) => `${v}deg`);
  const disabled = isTouchDevice() || prefersReducedMotion();

  const onMouseMove = (e: React.MouseEvent) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ry.set(((e.clientX - rect.left) / rect.width - 0.5) * 8);
    rx.set(-((e.clientY - rect.top) / rect.height - 0.5) * 8);
  };

  const onMouseLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        className="group grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-500 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10 lg:grid-cols-2"
      >
        <div className="relative overflow-hidden">
          <img
            src={project.image}
            alt={`${project.title} screenshot`}
            loading="lazy"
            className="h-64 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 lg:h-full lg:min-h-[340px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent opacity-60" />
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-10">
          <span className="mb-3 font-display text-sm text-accent">
            Featured Project · 0{index + 1}
          </span>
          <h3 className="mb-4 font-display text-3xl font-bold text-white sm:text-4xl">
            {project.title}
          </h3>
          <p className="mb-6 text-lg leading-relaxed text-white/65">{project.description}</p>
          <div className="mb-8 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/60"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-lg shadow-white/5 transition-all duration-300 hover:bg-accent hover:text-white hover:shadow-accent/30"
              >
                <ExternalLink
                  size={16}
                  className="transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
                />
                Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-accent/60 hover:bg-accent/10 hover:text-accent"
              >
                <Github size={16} /> Source Code
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Projects() {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28">
      <SectionHeading
        kicker="Work"
        title="Selected Projects"
        subtitle="Real products I've designed and built — from business systems to machine learning apps."
      />

      <div className="space-y-10">
        {featured.map((project, i) => (
          <TiltCard key={project.title} project={project} index={i} />
        ))}
      </div>

      {others.length > 0 && (
        <div className="mt-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8 font-display text-2xl font-bold text-white"
          >
            More Projects
          </motion.h3>
          <div className="grid gap-6 md:grid-cols-2">
            {others.map((project, i) => (
              <motion.a
                key={project.title}
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.image}
                    alt={`${project.title} screenshot`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-display text-xl font-bold text-white">
                      {project.title}
                    </h4>
                    <Github size={18} className="text-white/40 transition-colors group-hover:text-accent" />
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-white/60">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="text-xs font-medium text-accent/80">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
