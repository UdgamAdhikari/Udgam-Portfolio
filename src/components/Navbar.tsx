import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navLinks, profile } from "../data/content";
import Magnetic from "./Magnetic";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const go = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); go("#home"); }}
          className="font-display text-lg font-bold tracking-tight text-white"
        >
          UA<span className="text-accent">.</span>
        </a>

        <div className="hidden items-center gap-8 rounded-full border border-white/10 bg-white/[0.05] px-8 py-3 shadow-lg shadow-black/20 backdrop-blur-xl md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); go(link.href); }}
              className="group relative text-sm font-medium text-white/65 transition-colors duration-300 hover:text-white"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-accent to-pink-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <Magnetic>
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-lg shadow-white/5 transition-all duration-300 hover:bg-accent hover:text-white hover:shadow-accent/30"
            >
              Resume
            </a>
          </Magnetic>
        </div>

        <button
          className="text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-4 rounded-2xl border border-white/10 bg-ink/95 p-6 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col gap-5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); go(link.href); }}
                  className="font-display text-xl text-white/80 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 rounded-full bg-white px-5 py-3 text-center font-semibold text-ink"
              >
                Download Resume
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
