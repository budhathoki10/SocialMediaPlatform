"use client";

import { useState } from "react";
import { ChevronDown, Loader2, ShieldCheck } from "lucide-react";

type Match = {
  licenseId: string;
  plan: "pro" | "unlimited";
  billingPeriod: "monthly" | "yearly";
  currentPeriodEnd: string | null;
};

const PLAN_LABELS: Record<Match["plan"], string> = { pro: "Pro", unlimited: "Unlimited" };

/**
 * Fallback for the one case fs_license_id matching can't cover: a purchase
 * made with an email that never matched this AutoPilot account (checkout
 * happened outside this app's own locked-email link). Lets the logged-in
 * user self-report that email, see any active purchase found under it
 * (plan/period only — no card or payment details), and explicitly confirm
 * before it's attached to their account.
 */
export default function LinkPurchaseForm() {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "linking" | "linked">("idle");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setStatus("searching");
    setError(null);
    setMatches(null);

    try {
      const response = await fetch("/api/billing/link/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Something went wrong.");

      setMatches(data.matches);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  }

  async function handleConfirm(licenseId: string) {
    setStatus("linking");
    setError(null);

    try {
      const response = await fetch("/api/billing/link/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Could not link this license.");

      setStatus("linked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link this license.");
      setStatus("idle");
    }
  }

  if (status === "linked") {
    return (
      <div className="mx-auto mt-6 flex max-w-6xl items-center gap-3 rounded-panel border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        Linked — refresh this page to see your updated plan.
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 max-w-6xl rounded-panel border border-slate-200 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
        aria-expanded={expanded}
      >
        <div>
          <p className="text-sm font-bold text-slate-900">Paid, but plan not showing up?</p>
          <p className="mt-0.5 text-sm text-slate-500">
            If you checked out with a different email than your AutoPilot login, link it here.
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email you paid with"
              className="h-11 w-full rounded-control border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary-tint sm:max-w-xs"
            />
            <button
              type="submit"
              disabled={status === "searching"}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-control border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "searching" && <Loader2 className="h-4 w-4 animate-spin" />}
              Find my purchase
            </button>
          </form>

          {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

          {matches && matches.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No active purchase found under that email.</p>
          )}

          {matches && matches.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {matches.map((match) => (
                <li
                  key={match.licenseId}
                  className="flex flex-col items-start justify-between gap-3 rounded-control border border-slate-200 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {PLAN_LABELS[match.plan]} — {match.billingPeriod === "yearly" ? "yearly" : "monthly"} billing
                    {match.currentPeriodEnd && (
                      <span className="text-slate-500"> · renews {new Date(match.currentPeriodEnd).toLocaleDateString()}</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleConfirm(match.licenseId)}
                    disabled={status === "linking"}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-control bg-primary px-4 text-xs font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "linking" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    This is mine — link it
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
