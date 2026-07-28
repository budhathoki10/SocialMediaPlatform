"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <main className="flex h-screen items-center justify-center bg-[#f6f8fb] px-6 text-center text-slate-950">
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-slate-800">Something went wrong loading this page.</p>
        <p className="mt-1 text-sm text-slate-500">
          This is usually a brief connection hiccup — try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-control bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
