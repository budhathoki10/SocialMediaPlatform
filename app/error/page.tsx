import Link from "next/link";

export default function ErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-6 py-12 text-slate-950">
      <section className="w-full max-w-[460px] rounded-panel border border-slate-200 bg-white px-8 py-10 text-center shadow-panel">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">AutoPilot</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your sign-in session may have expired or used an old callback link. Start again to continue safely.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login?callbackUrl=/onboarding"
            className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-hover"
          >
            Sign in again
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-control border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-card transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
