"use client";

import { Check, Mail, MessageCircle, Send, User } from "lucide-react";
import { useState } from "react";

import CharacterCounter from "@/components/motion/CharacterCounter";
import PressableButton from "@/components/motion/PressableButton";

const MAX_LENGTH = 2000;
const MIN_LENGTH = 10;

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
  const trimmedLength = message.trim().length;
  const hasMessage = trimmedLength > 0;
  const belowMin = hasMessage && trimmedLength < MIN_LENGTH;
  const canSubmit = trimmedLength >= MIN_LENGTH;

  const updateMessage = (value: string) => {
    setMessage(value);
    if (submitted) setSubmitted(false);
    if (error) setError("");
  };

  const submitFeedback = async () => {
    const trimmed = message.trim();

    setError("");
    setSubmitted(false);
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
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Feedback</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Share your feedback</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Tell us what&apos;s working, what&apos;s missing, or what&apos;s broken. We read every message.
        </p>
      </div>

      <section className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
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
          <label htmlFor="feedback-message" className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            Your feedback
          </label>
          <div
            className={`relative mt-2 min-h-55 rounded-card border bg-slate-50/60 p-5 transition focus-within:bg-white focus-within:ring-4 ${
              error
                ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
                : "border-slate-200 focus-within:border-primary focus-within:ring-primary/10"
            }`}
          >
            <textarea
              id="feedback-message"
              value={message}
              maxLength={MAX_LENGTH}
              onChange={(event) => updateMessage(event.target.value)}
              placeholder="What would you like us to know?"
              aria-invalid={Boolean(error)}
              aria-describedby="feedback-hint"
              className="min-h-[160px] w-full resize-none border-0 bg-transparent text-lg font-semibold leading-8 text-slate-800 outline-none placeholder:text-slate-300"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <span
                id="feedback-hint"
                className={`inline-flex items-center gap-2 text-xs font-bold ${
                  belowMin ? "text-amber-600" : "text-slate-400"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                {belowMin
                  ? `Write ${MIN_LENGTH - trimmedLength} more character${MIN_LENGTH - trimmedLength === 1 ? "" : "s"}`
                  : "Your feedback goes straight to the team"}
              </span>
              <CharacterCounter length={message.length} max={MAX_LENGTH} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-card border border-slate-200 bg-white px-5 py-4 shadow-card">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <PressableButton
            type="button"
            disabled={!canSubmit || submitting}
            onClick={submitFeedback}
            className="inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {submitting ? "Sending..." : submitted ? "Feedback Sent" : "Send Feedback"}
            {submitted ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </PressableButton>
        </div>
        {(submitted || error) && (
          <p
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
            className={`mt-3 text-right text-sm font-semibold ${error ? "text-red-600" : "text-emerald-600"}`}
          >
            {error || "Thanks! Your feedback has been sent."}
          </p>
        )}
      </section>
    </div>
  );
}
