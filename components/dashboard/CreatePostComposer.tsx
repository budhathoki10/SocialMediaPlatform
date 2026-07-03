"use client";

import {
  AtSign,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Hash,
  ImagePlus,
  Link2,
  Save,
  Send,
  Smile,
} from "lucide-react";
import { useMemo, useState } from "react";

const MAX_LENGTH = 3000;
type SaveMode = "draft" | "scheduled";

function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getCalendarDays(visibleMonth: Date, selectedDateValue: string) {
  const selectedDate = parseDateInputValue(selectedDateValue);
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      value: toDateInputValue(date),
      label: date.getDate().toString(),
      muted: date.getMonth() !== visibleMonth.getMonth(),
      selected: toDateInputValue(date) === toDateInputValue(selectedDate),
    };
  });
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      className={`relative h-7 w-12 rounded-full p-1 transition duration-300 ${
        enabled ? "bg-[#4338ca]" : "bg-slate-200"
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition duration-300 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function CreatePostComposer({ userName }: { userName?: string | null }) {
  const [content, setContent] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [publishDate, setPublishDate] = useState(() => toDateInputValue(new Date()));
  const [publishTime, setPublishTime] = useState("09:00");
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateInputValue(toDateInputValue(new Date())));
  const [savingMode, setSavingMode] = useState<SaveMode | null>(null);
  const [savedMode, setSavedMode] = useState<SaveMode | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const remaining = MAX_LENGTH - content.length;
  const hasContent = content.trim().length > 0;
  const displayName = userName?.trim().split(" ")[0] || "there";
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth, publishDate), [publishDate, visibleMonth]);
  const calendarMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
      }).format(visibleMonth),
    [visibleMonth],
  );
  const scheduleLabel = useMemo(() => {
    if (!scheduleEnabled) return "Scheduling is off";

    const date = new Date(`${publishDate}T${publishTime}:00`);

    if (Number.isNaN(date.getTime())) return "Scheduled time selected";

    return `Scheduled for ${new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
    }).format(date)}, ${new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)}`;
  }, [publishDate, publishTime, scheduleEnabled]);
  const updatePublishDate = (value: string) => {
    setPublishDate(value);
    setVisibleMonth(parseDateInputValue(value));
  };
  const moveCalendarMonth = (offset: number) => {
    setVisibleMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };
  const savePost = async (mode: SaveMode) => {
    const trimmedContent = content.trim();

    setSaveMessage("");
    setSaveError("");
    setSavedMode(null);

    if (!trimmedContent) {
      setSaveError("Write something before saving.");
      return;
    }

    setSavingMode(mode);

    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmedContent,
          scheduled_time: mode === "scheduled" ? `${publishDate}T${publishTime}:00` : null,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to save post.");
      }

      setSavedMode(mode);
      setSaveMessage(mode === "scheduled" ? "Successfully scheduled post." : "Successfully saved draft.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setSavingMode(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4338ca]">Composer</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Create Post</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Draft a social post, choose platforms, and schedule it only when you are ready.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
          </div>

          <div className="p-5">
            <div className="min-h-[360px] rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50">
              <textarea
                value={content}
                maxLength={MAX_LENGTH}
                onChange={(event) => setContent(event.target.value)}
                placeholder={`What's on your mind, ${displayName}?`}
                className="min-h-[280px] w-full resize-none border-0 bg-transparent text-lg font-semibold leading-8 text-slate-800 outline-none placeholder:text-slate-300"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-1.5">
                  {[ImagePlus, Link2, Smile, Hash, AtSign].map((Icon, index) => (
                    <button
                      key={index}
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-[#4338ca] hover:shadow-sm"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <span className={`text-xs font-bold ${remaining < 30 ? "text-amber-600" : "text-slate-400"}`}>
                  {content.length} / {MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-[#4338ca]">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Scheduling</h2>
                  <p className="text-xs text-slate-500">Control publish timing.</p>
                </div>
              </div>
              <Toggle enabled={scheduleEnabled} onToggle={() => setScheduleEnabled((enabled) => !enabled)} />
            </div>

            <div className={`mt-5 space-y-4 transition ${scheduleEnabled ? "opacity-100" : "opacity-45"}`}>
              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Publish Date</span>
                <input
                  type="date"
                  value={publishDate}
                  disabled={!scheduleEnabled}
                  onChange={(event) => updatePublishDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Time</span>
                <input
                  type="time"
                  value={publishTime}
                  disabled={!scheduleEnabled}
                  onChange={(event) => setPublishTime(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />
              </label>
            </div>
          </section>

          {scheduleEnabled && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Calendar</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{calendarMonthLabel}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveCalendarMonth(-1)}
                    className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCalendarMonth(1)}
                    className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1">
                {calendarDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => updatePublishDate(day.value)}
                    className={`grid h-8 place-items-center rounded-lg text-xs font-bold transition ${
                      day.selected
                        ? "bg-[#4338ca] text-white shadow-md shadow-indigo-200"
                        : day.muted
                          ? "text-slate-300 hover:bg-slate-50 hover:text-slate-500"
                          : "text-slate-600 hover:bg-indigo-50 hover:text-[#4338ca]"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={!hasContent || savingMode !== null}
            onClick={() => savePost("draft")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-[#4338ca] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
          >
            {savedMode === "draft" ? <Check className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
            {savingMode === "draft" ? "Saving..." : savedMode === "draft" ? "Draft Saved" : "Save as Draft"}
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
              {scheduleEnabled ? <Check className="h-4 w-4 text-emerald-500" /> : <CalendarDays className="h-4 w-4 text-slate-400" />}
              {scheduleLabel}
            </span>
            <button
              type="button"
              disabled={!scheduleEnabled || !hasContent || savingMode !== null}
              onClick={() => savePost("scheduled")}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#4338ca] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#3730a3] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {savingMode === "scheduled" ? "Scheduling..." : savedMode === "scheduled" ? "Scheduled" : "Schedule Post"}
              {savedMode === "scheduled" ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {(saveMessage || saveError) && (
          <p
            aria-live="polite"
            className={`mt-3 text-sm font-semibold ${saveError ? "text-red-600" : "text-emerald-600"}`}
          >
            {saveError || saveMessage}
          </p>
        )}
      </section>
    </div>
  );
}
