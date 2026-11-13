import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { quietButtonClass } from "@/components/admin/ui";
import { logout, logoutEverywhere } from "@/app/admin/_actions/auth";
import { inquiryCounts } from "@/server/admin/inquiries";
import { requireAdminPage } from "@/server/auth/guard";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s — Dashboard" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const counts = await inquiryCounts(db());

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[15rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-fg focus:px-3 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <aside className="sticky top-0 z-20 border-b border-line bg-bg px-4 py-3 lg:h-svh lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
        <div className="mb-3 flex items-center justify-between lg:mb-8 lg:block">
          <p className="label">Dashboard</p>
          <a href="/" target="_blank" rel="noreferrer" className="label text-muted hover:text-fg lg:mt-2 lg:inline-block">
            View site ↗
          </a>
        </div>
        <AdminNav newCount={counts.new} />
        <div className="mt-3 flex gap-1 border-t border-line pt-3 lg:mt-8 lg:flex-col">
          <form action={logout}>
            <button type="submit" className={quietButtonClass}>
              Sign out
            </button>
          </form>
          <form action={logoutEverywhere}>
            <button type="submit" className={quietButtonClass}>
              Sign out everywhere
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        {children}
      </main>
    </div>
  );
}
