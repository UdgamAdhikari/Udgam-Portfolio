"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminNav({ newCount }: { newCount: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {LINKS.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-base transition-colors focus-visible:outline-2 focus-visible:outline-signal ${
                  active ? "bg-fg text-bg" : "text-muted hover:bg-line hover:text-fg"
                }`}
              >
                {link.label}
                {link.href === "/admin/inquiries" && newCount > 0 && (
                  <span className="label rounded-full bg-signal px-1.5 text-[11px] text-bg">
                    {newCount}
                    <span className="sr-only"> new</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
