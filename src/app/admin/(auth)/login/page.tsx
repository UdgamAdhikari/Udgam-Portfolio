import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { currentSession } from "@/server/auth/guard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in — Dashboard", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await currentSession()) redirect("/admin");
  return (
    <main id="main" className="grid min-h-svh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="label text-muted">Portfolio · Dashboard</p>
        <h1 className="mt-2 mb-8 font-display text-4xl font-[620] [font-variation-settings:'wdth'_105]">Sign in</h1>
        <LoginForm />
        <p className="mt-8 text-sm text-muted">Private area. Sign-in attempts are rate limited.</p>
      </div>
    </main>
  );
}
