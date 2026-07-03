import { motion } from "framer-motion";

interface Props {
  kicker: string;
  title: string;
  subtitle?: string;
}

const wordVariants = {
  hidden: { y: "110%" },
  visible: {
    y: 0,
    transition: { duration: 0.7, ease: [0.33, 1, 0.68, 1] as const },
  },
};

// Heading with a per-word staggered reveal on scroll.
// The whileInView observer lives on the h2 (never clipped) — putting it on the
// translated words themselves breaks IntersectionObserver, since a word hidden
// behind overflow:hidden is never "in view".
export default function SectionHeading({ kicker, title, subtitle }: Props) {
  const words = title.split(" ");

  return (
    <div className="mb-12 sm:mb-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mb-5 flex items-center gap-4"
      >
        <span className="h-px w-10 bg-accent sm:w-14" />
        <span className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-accent sm:text-sm">
          {kicker}
        </span>
      </motion.div>

      <motion.h2
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        transition={{ staggerChildren: 0.08 }}
        className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl"
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-1.5 align-top">
            <motion.span variants={wordVariants} className="inline-block">
              {word}
            </motion.span>
            {i < words.length - 1 && <span>&nbsp;</span>}
          </span>
        ))}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 max-w-2xl text-lg text-white/65 sm:text-xl"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
