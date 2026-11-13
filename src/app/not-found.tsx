import Link from "next/link";
import Header from "@/components/site/Header";
import { getSite } from "@/server/content/site";

export default async function NotFound() {
  const { profile } = await getSite();
  return (
    <>
      <Header home={false} profile={profile} />
      <main id="main" className="flex min-h-[80svh] flex-col justify-center px-4 sm:px-8 lg:px-12">
        <p className="label text-muted">404 — Missing part</p>
        <h1 className="mt-4 font-display text-[clamp(3rem,12vw,12rem)] leading-[0.86] font-[640] tracking-[-0.025em] [font-variation-settings:'wdth'_120]">
          This part isn&apos;t
          <br />
          on the bench<span className="text-signal">.</span>
        </h1>
        <Link href="/" className="label mt-10 inline-flex min-h-11 items-center underline-offset-4 hover:underline">
          ← Back to the portfolio
        </Link>
      </main>
    </>
  );
}
