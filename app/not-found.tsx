import type { Metadata } from "next";
import Link from "next/link";

// Next.js serves this for every unmatched route with a 404 status
// automatically — no manual status code handling needed here.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-6 py-12 text-slate-950">
      <section className="w-full max-w-[460px] rounded-panel border border-slate-200 bg-white px-8 py-10 text-center shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">AutoPilot</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-hover"
          >
            Back home
          </Link>
          <Link
            href="/billing"
            className="inline-flex h-11 items-center justify-center rounded-control border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-card transition hover:border-slate-300 hover:bg-slate-50"
          >
            View pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
