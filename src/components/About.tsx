import { motion } from "framer-motion";
import { profile } from "../data/content";
import SectionHeading from "./SectionHeading";

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
                    over two years of hands-on professional experience
                  </span>{" "}
                  building responsive, production-ready web applications with{" "}
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
    </section>
  );
}
