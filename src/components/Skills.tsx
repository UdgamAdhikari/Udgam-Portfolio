import { motion } from "framer-motion";
import { skillGroups } from "../data/content";
import SectionHeading from "./SectionHeading";

export default function Skills() {
  return (
    <section id="skills" className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28">
      <SectionHeading
        kicker="Skills"
        title="My Toolkit"
        subtitle="The technologies I use to design, build and ship modern web applications."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {skillGroups.map((group, gi) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: gi * 0.1 }}
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] sm:p-10"
          >
            <h3 className="mb-7 font-display text-2xl font-bold text-white sm:text-3xl">
              <span className="mr-3 text-accent">0{gi + 1}</span>
              {group.title}
            </h3>
            <div className="flex flex-wrap gap-3">
              {group.skills.map((skill, si) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: gi * 0.1 + si * 0.05 }}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-base font-medium text-white/75 transition-colors hover:border-accent/60 hover:bg-accent/10 hover:text-white"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
