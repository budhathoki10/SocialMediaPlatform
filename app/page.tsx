export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-20 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <section className="w-full max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          AutoPilot
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Social media automation is ready.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          MongoDB schemas, the database connection, and the Next.js custom server are configured.
        </p>
        <a
          href="/api/health"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Check API health
        </a>
      </section>
    </main>
  );
}
