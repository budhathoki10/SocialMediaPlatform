"use client";

import { Check, Mail, MessageCircle, Send, User } from "lucide-react";
import { useState } from "react";

const MAX_LENGTH = 2000;

export default function FeedbackForm({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const hasMessage = message.trim().length > 0;

  const submitFeedback = async () => {
    const trimmed = message.trim();

    setError("");
    setSubmitted(false);

    if (!trimmed) {
      setError("Write your feedback before sending.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to send feedback.");
      }

      setSubmitted(true);
      setMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4338ca]">Feedback</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Share your feedback</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Tell us what&apos;s working, what&apos;s missing, or what&apos;s broken. We read every message.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-5 py-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            {userName || "You"}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Mail className="h-4 w-4 text-slate-400" />
            {userEmail || "—"}
          </span>
        </div>

        <div className="p-5">
          <div className="min-h-[220px] rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50">
            <textarea
              value={message}
              maxLength={MAX_LENGTH}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What would you like us to know?"
              className="min-h-[160px] w-full resize-none border-0 bg-transparent text-lg font-semibold leading-8 text-slate-800 outline-none placeholder:text-slate-300"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                <MessageCircle className="h-4 w-4" />
                Your feedback goes straight to the team
              </span>
              <span className="text-xs font-bold text-slate-400">
                {message.length} / {MAX_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={!hasMessage || submitting}
            onClick={submitFeedback}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#4338ca] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#3730a3] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {submitting ? "Sending..." : submitted ? "Feedback Sent" : "Send Feedback"}
            {submitted ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {(submitted || error) && (
          <p aria-live="polite" className={`mt-3 text-right text-sm font-semibold ${error ? "text-red-600" : "text-emerald-600"}`}>
            {error || "Thanks! Your feedback has been sent."}
          </p>
        )}
      </section>
    </div>
  );
}
