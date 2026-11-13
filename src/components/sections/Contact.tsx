"use client";

import { useState } from "react";
import type { Settings } from "@/lib/content-schema";
import type { SiteProfile } from "@/server/content/site";
import BookingDialog from "@/components/booking/BookingDialog";
import ContactBackdrop, {
  ContactDial,
} from "@/components/contact/ContactBackdrop";
import { openBooking } from "@/lib/booking-events";
import { useKathmanduTime } from "@/lib/useKathmanduTime";

export default function Contact({
  contact,
  profile,
}: {
  contact: Settings["contact"];
  profile: SiteProfile;
}) {
  const [copied, setCopied] = useState(false);
  const time = useKathmanduTime();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard can be blocked; fall back to opening the mail client.
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="px-2 pt-12 pb-2 sm:px-4 lg:pt-16"
    >

      {/* An inset panel in the other ink, lit softly from above. */}
      <div
        data-part="Contact · panel"
        className="inverse relative isolate mt-6 flex flex-col overflow-hidden rounded-[28px] px-4 pt-12 pb-5 sm:px-8 lg:px-12 lg:pt-14"
      >
        {/* Backdrop: a dial and a warm glow — its own look, unlike the parts elsewhere. */}
        <ContactBackdrop />
        <div className="flex flex-1 flex-col items-center text-center">
          <h2
            id="contact-title"
            className="font-display text-[clamp(2.5rem,5.5vw,5.75rem)] leading-[0.9] font-[560] tracking-[-0.03em] [font-variation-settings:'wdth'_118]"
          >
            {contact.title.map((line, i) => (
              <span key={line} className="block">
                {i === contact.title.length - 1 && line.endsWith(".") ? (
                  <>
                    {line.slice(0, -1)}
                    <span className="text-signal">.</span>
                  </>
                ) : (
                  line
                )}
              </span>
            ))}
          </h2>
          <p className="mt-5 max-w-[42ch] text-base leading-snug text-pretty text-muted sm:text-lg">
            {contact.lede}
          </p>

          {/* The last part on the bench: a round key that opens the call scheduler. */}
          <div className="relative mt-8">
            <ContactDial />
            <button
              type="button"
              onClick={openBooking}
              aria-haspopup="dialog"
              className="group grid size-36 place-items-center rounded-full bg-fg text-bg shadow-[0_6px_0_0_var(--muted)] transition-[translate,box-shadow,scale] duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_10px_0_0_var(--muted)] active:translate-y-1 active:shadow-[0_2px_0_0_var(--muted)] sm:size-40"
            >
              <span>
                <span className="block font-display text-xl leading-tight font-[600] [font-variation-settings:'wdth'_100] sm:text-2xl">
                  Get in
                  <br />
                  touch
                </span>
                <span className="label mt-2 block opacity-70">30 min call</span>
              </span>
            </button>
          </div>

          {/* Or just copy the address. */}
          <button
            type="button"
            onClick={copy}
            className="mt-6 rounded-full border border-line bg-[color-mix(in_srgb,var(--bg)_60%,transparent)] px-4 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-[color-mix(in_srgb,var(--fg)_8%,transparent)]"
          >
            <span className="label mr-2 text-muted">
              {copied ? "Copied to clipboard" : "Click to copy"}
            </span>
            {profile.email}
          </button>
          <p role="status" className="sr-only">
            {copied ? `${profile.email} copied to clipboard` : ""}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mt-12">
          <dl className="label grid w-fit grid-cols-[3.5rem_auto] border border-line">
            <div
              aria-hidden="true"
              className="row-span-2 grid place-items-center border-r border-line"
            >
              <svg viewBox="0 0 48 24" className="w-7">
                <rect
                  x="1.5"
                  y="1.5"
                  width="45"
                  height="21"
                  rx="10.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <circle cx="35" cy="12" r="6.5" fill="var(--signal)" />
              </svg>
            </div>
            <div className="border-b border-line px-3 py-2">
              <dt className="sr-only">Based in</dt>
              <dd>{profile.location}</dd>
            </div>
            <div className="px-3 py-2 text-muted">
              <dt className="sr-only">Local time</dt>
              <dd className="tabular-nums">
                {time ? `${time} · GMT+5:45` : "GMT+5:45"}
              </dd>
            </div>
          </dl>

          <div className="sm:text-right">
            <p className="label text-muted">For anything else</p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-1 inline-flex min-h-11 items-center text-lg underline-offset-4 hover:underline"
            >
              ↳ {profile.email}
            </a>
          </div>
        </div>
      </div>
      <BookingDialog
        ownerName={profile.name}
        ownerEmail={profile.email}
        photo={profile.photo}
      />
    </section>
  );
}
