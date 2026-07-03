import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Github, Linkedin, Instagram, Facebook } from "lucide-react";
import { profile } from "../data/content";
import SectionHeading from "./SectionHeading";
import Magnetic from "./Magnetic";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "A valid email is required";
    if (!form.subject.trim()) next.subject = "Subject is required";
    if (!form.message.trim()) next.message = "Message is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    // No backend needed — opens the visitor's mail client pre-filled.
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(form.subject)}&body=${body}`;
  };

  const contactInfo = [
    { icon: <Mail size={20} />, label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    { icon: <Phone size={20} />, label: "Phone", value: profile.phone, href: `tel:${profile.phone.replace(/\s/g, "")}` },
    { icon: <MapPin size={20} />, label: "Location", value: profile.location },
  ];

  const socials = [
    { icon: <Github size={18} />, href: profile.social.github, label: "GitHub" },
    { icon: <Linkedin size={18} />, href: profile.social.linkedin, label: "LinkedIn" },
    { icon: <Instagram size={18} />, href: profile.social.instagram, label: "Instagram" },
    { icon: <Facebook size={18} />, href: profile.social.facebook, label: "Facebook" },
  ];

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white placeholder-white/25 outline-none transition-colors focus:border-accent";

  return (
    <section id="contact" className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28">
      <SectionHeading
        kicker="Contact"
        title="Let's Work Together"
        subtitle="Have an opportunity or a project in mind? I typically respond within 24 hours."
      />

      <div className="grid gap-14 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            {contactInfo.map((info) => (
              <a
                key={info.label}
                href={info.href}
                className="group flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent transition-transform group-hover:scale-110">
                  {info.icon}
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-widest text-white/35">
                    {info.label}
                  </span>
                  <span className="font-medium text-white">{info.value}</span>
                </span>
              </a>
            ))}
          </div>

          <div>
            <p className="mb-4 text-sm uppercase tracking-widest text-white/35">Find me on</p>
            <div className="flex gap-3">
              {socials.map((s) => (
                <Magnetic key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:text-accent"
                  >
                    {s.icon}
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>

          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full border border-accent/50 px-8 py-4 font-semibold text-accent transition-all duration-300 hover:scale-[1.03] hover:bg-accent hover:text-white hover:shadow-lg hover:shadow-accent/30"
          >
            Download Resume ↓
          </a>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-xl shadow-black/20 backdrop-blur-md sm:p-10"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm text-white/50">
                Your Name
              </label>
              <input id="name" name="name" value={form.name} onChange={onChange} className={inputClass} placeholder="Name" />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-white/50">
                Your Email
              </label>
              <input id="email" name="email" type="email" value={form.email} onChange={onChange} className={inputClass} placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="mb-2 block text-sm text-white/50">
              Subject
            </label>
            <input id="subject" name="subject" value={form.subject} onChange={onChange} className={inputClass} placeholder="Job opportunity / Project" />
            {errors.subject && <p className="mt-1 text-sm text-red-400">{errors.subject}</p>}
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm text-white/50">
              Message
            </label>
            <textarea id="message" name="message" rows={5} value={form.message} onChange={onChange} className={`${inputClass} resize-none`} placeholder="Tell me about it..." />
            {errors.message && <p className="mt-1 text-sm text-red-400">{errors.message}</p>}
          </div>
          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-pink-500 px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/30 active:scale-[0.99]"
          >
            <Send
              size={18}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
            Send Message
          </button>
        </motion.form>
      </div>
    </section>
  );
}
