import { motion } from "framer-motion";
import { Briefcase, GraduationCap } from "lucide-react";
import { timeline } from "../data/content";
import SectionHeading from "./SectionHeading";

export default function Experience() {
  return (
    <section id="experience" className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28">
      <SectionHeading
        kicker="Journey"
        title="Experience & Education"
        subtitle="Where I've worked, what I've shipped, and where I studied."
      />

      <div className="relative mx-auto max-w-4xl">
        {/* vertical line */}
        <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-accent/60 via-white/15 to-transparent sm:left-6" />

        <div className="space-y-8 sm:space-y-10">
          {timeline.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative pl-16 sm:pl-24"
            >
              <div className="absolute left-0 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-ink text-accent sm:h-12 sm:w-12">
                {item.type === "work" ? <Briefcase size={18} /> : <GraduationCap size={18} />}
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10 sm:p-9">
                <span className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-accent sm:text-sm">
                  {item.period}
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-base font-medium text-white/45">{item.place}</p>
                <p className="mt-4 text-lg leading-relaxed text-white/60">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
