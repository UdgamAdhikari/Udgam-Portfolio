import { useEffect, useRef } from "react";
import { motion, animate, useInView } from "framer-motion";
import { profile, stats } from "../data/content";
import SectionHeading from "./SectionHeading";
import { prefersReducedMotion } from "../lib/motion";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (prefersReducedMotion()) {
      ref.current.textContent = `${value}${suffix}`;
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function About() {
  return (
    <section id="about" className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28">
      <SectionHeading
        kicker="About"
        title="Who I Am"
        subtitle="A frontend developer turning ideas into scalable, production-ready web applications."
      />

      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {profile.bio.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="text-xl leading-relaxed text-white/70 sm:text-2xl sm:leading-relaxed"
            >
              {i === 0 ? (
                <>
                  I'm a frontend developer with{" "}
                  <span className="font-semibold text-white">
                    over a year of hands-on professional experience
                  </span>{" "}
                  building scalable, production-ready web applications with{" "}
                  <span className="font-semibold text-accent">React</span> and{" "}
                  <span className="font-semibold text-accent">Next.js</span>.
                </>
              ) : (
                paragraph
              )}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="group relative mx-auto w-72 sm:w-80 lg:w-[360px]"
        >
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-br from-accent/50 to-pink-500/50 opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-90" />
          <img
            src={profile.photo}
            alt={profile.name}
            loading="lazy"
            className="relative aspect-square w-full rounded-3xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </motion.div>
      </div>

      {/* Animated stats */}
      <div className="mt-16 grid grid-cols-2 gap-4 sm:mt-20 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10 sm:p-8"
          >
            <div className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              <Counter value={stat.value} suffix={stat.suffix} />
            </div>
            <p className="mt-3 text-sm font-medium text-white/50 sm:text-base">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
