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
  X,
} from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import CharacterCounter from "@/components/motion/CharacterCounter";
import PressableButton from "@/components/motion/PressableButton";
import { SPRING } from "@/lib/motion/tokens";

const monthSlideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -28 : 28, opacity: 0 }),
};

const MAX_LENGTH = 3000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const EMOJI_OPTIONS = [
  "😀", "😂", "😅", "😍", "🤔", "😎", "🙌", "👏", "🙏", "💪",
  "🔥", "✨", "🎉", "🚀", "💡", "📈", "✅", "👀", "💬", "❤️",
  "😉", "😢", "😮", "🤝", "👍", "👎", "⭐", "🏆", "🧠", "⚡",
];
type SaveMode = "draft" | "scheduled";
type ToolbarPopover = "link" | "emoji" | null;

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
    <PressableButton
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      className={`relative h-7 w-12 rounded-full p-1 transition-colors duration-300 ${
        enabled ? "bg-primary" : "bg-slate-200"
      }`}
    >
      <motion.span
        animate={{ x: enabled ? 20 : 0 }}
        transition={SPRING.press}
        className="block h-5 w-5 rounded-full bg-white shadow-sm"
      />
    </PressableButton>
  );
}

export default function CreatePostComposer({ userName }: { userName?: string | null }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<ToolbarPopover>(null);
  const [linkValue, setLinkValue] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [publishDate, setPublishDate] = useState(() => toDateInputValue(new Date()));
  const [publishTime, setPublishTime] = useState("09:00");
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateInputValue(toDateInputValue(new Date())));
  const [monthSlideDirection, setMonthSlideDirection] = useState(1);
  const [savingMode, setSavingMode] = useState<SaveMode | null>(null);
  const [savedMode, setSavedMode] = useState<SaveMode | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const hasContent = content.trim().length > 0;
  const displayName = userName?.trim().split(" ")[0] || "there";

  useEffect(() => {
    if (!activePopover) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setActivePopover(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePopover(null);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activePopover]);

  function insertAtCursor(insertText: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const nextContent = (content.slice(0, start) + insertText + content.slice(end)).slice(0, MAX_LENGTH);

    setContent(nextContent);
    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      const cursor = Math.min(start + insertText.length, nextContent.length);
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handleImageButtonClick() {
    setMediaError(null);
    fileInputRef.current?.click();
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMediaError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setMediaError("Images must be 4MB or smaller.");
      return;
    }

    setMediaError(null);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setMediaError("Unable to read that image.");
    reader.readAsDataURL(file);
  }

  function submitLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedLink = linkValue.trim();

    if (!trimmedLink) return;

    insertAtCursor(trimmedLink);
    setLinkValue("");
    setActivePopover(null);
  }

  function insertEmoji(emoji: string) {
    insertAtCursor(emoji);
    setActivePopover(null);
  }

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
    setMonthSlideDirection(offset > 0 ? 1 : -1);
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
          media_url: mediaPreview,
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
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Composer</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Create Post</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Draft a social post, choose platforms, and schedule it only when you are ready.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
          </div>

          <div className="p-5">
            <div className="relative min-h-[360px] rounded-card border border-slate-200 bg-slate-50/60 p-5 transition focus-within:bg-white">
              <textarea
                ref={textareaRef}
                value={content}
                maxLength={MAX_LENGTH}
                onChange={(event) => setContent(event.target.value)}
                placeholder={`What's on your mind, ${displayName}?`}
                className="min-h-[280px] w-full resize-none border-0 bg-transparent text-lg font-semibold leading-8 text-slate-800 outline-none placeholder:text-slate-300"
              />

              {mediaPreview && (
                <div className="relative mb-3 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- locally-picked file rendered from a data URL, not a remote/optimizable source */}
                  <img src={mediaPreview} alt="" className="max-h-40 rounded-control border border-slate-200 object-cover" />
                  <button
                    type="button"
                    onClick={() => setMediaPreview(null)}
                    aria-label="Remove image"
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-white shadow-card transition hover:bg-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {mediaError && <p className="mb-3 text-xs font-semibold text-red-600">{mediaError}</p>}

              <div ref={toolbarRef} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleImageButtonClick}
                    aria-label="Add image"
                    title="Add image"
                    className="grid h-9 w-9 place-items-center rounded-control text-slate-400 transition hover:bg-white hover:text-primary hover:shadow-card"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActivePopover((current) => (current === "link" ? null : "link"))}
                      aria-label="Insert link"
                      title="Insert link"
                      aria-expanded={activePopover === "link"}
                      className={`grid h-9 w-9 place-items-center rounded-control text-slate-400 transition hover:bg-white hover:text-primary hover:shadow-card ${
                        activePopover === "link" ? "bg-white text-primary shadow-card" : ""
                      }`}
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {activePopover === "link" && (
                        <motion.form
                          onSubmit={submitLink}
                          initial={{ opacity: 0, scale: 0.94, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94, y: 6 }}
                          transition={SPRING.gentle}
                          className="absolute bottom-11 left-0 z-30 w-64 rounded-card border border-slate-200 bg-white p-3 shadow-panel"
                        >
                          <label className="block text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                            Link URL
                          </label>
                          <input
                            type="url"
                            autoFocus
                            value={linkValue}
                            onChange={(event) => setLinkValue(event.target.value)}
                            placeholder="https://example.com"
                            className="mt-1.5 h-9 w-full rounded-control border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                          />
                          <PressableButton
                            type="submit"
                            className="mt-2 h-8 w-full rounded-control bg-primary text-xs font-bold text-white transition hover:bg-primary-hover"
                          >
                            Insert
                          </PressableButton>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActivePopover((current) => (current === "emoji" ? null : "emoji"))}
                      aria-label="Insert emoji"
                      title="Insert emoji"
                      aria-expanded={activePopover === "emoji"}
                      className={`grid h-9 w-9 place-items-center rounded-control text-slate-400 transition hover:bg-white hover:text-primary hover:shadow-card ${
                        activePopover === "emoji" ? "bg-white text-primary shadow-card" : ""
                      }`}
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {activePopover === "emoji" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.94, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94, y: 6 }}
                          transition={SPRING.gentle}
                          className="absolute bottom-11 left-0 z-30 grid w-64 grid-cols-8 gap-1 rounded-card border border-slate-200 bg-white p-3 shadow-panel"
                        >
                          {EMOJI_OPTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="grid h-7 w-7 place-items-center rounded-control text-base transition hover:bg-primary-tint"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    onClick={() => insertAtCursor("#")}
                    aria-label="Insert hashtag"
                    title="Insert hashtag"
                    className="grid h-9 w-9 place-items-center rounded-control text-slate-400 transition hover:bg-white hover:text-primary hover:shadow-card"
                  >
                    <Hash className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor("@")}
                    aria-label="Insert mention"
                    title="Insert mention"
                    className="grid h-9 w-9 place-items-center rounded-control text-slate-400 transition hover:bg-white hover:text-primary hover:shadow-card"
                  >
                    <AtSign className="h-4 w-4" />
                  </button>
                </div>
                <CharacterCounter length={content.length} max={MAX_LENGTH} />
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-control bg-primary-tint text-primary">
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
                  className="mt-2 h-11 w-full rounded-control border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Time</span>
                <input
                  type="time"
                  value={publishTime}
                  disabled={!scheduleEnabled}
                  onChange={(event) => setPublishTime(event.target.value)}
                  className="mt-2 h-11 w-full rounded-control border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
            </div>
          </section>

          {scheduleEnabled && (
            <section className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Calendar</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{calendarMonthLabel}</p>
                </div>
                <div className="flex items-center gap-1">
                  <PressableButton
                    type="button"
                    onClick={() => moveCalendarMonth(-1)}
                    className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </PressableButton>
                  <PressableButton
                    type="button"
                    onClick={() => moveCalendarMonth(1)}
                    className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </PressableButton>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="mt-3 overflow-hidden">
                <AnimatePresence mode="wait" custom={monthSlideDirection} initial={false}>
                  <motion.div
                    key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`}
                    custom={monthSlideDirection}
                    variants={monthSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={SPRING.gentle}
                    className="grid grid-cols-7 gap-1"
                  >
                    {calendarDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => updatePublishDate(day.value)}
                        className={`grid h-8 place-items-center rounded-control text-xs font-bold transition ${
                          day.selected
                            ? "bg-primary text-white shadow-card"
                            : day.muted
                              ? "text-slate-300 hover:bg-slate-50 hover:text-slate-500"
                              : "text-slate-600 hover:bg-primary-tint hover:text-primary"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="mt-5 rounded-card border border-slate-200 bg-white px-5 py-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PressableButton
            type="button"
            disabled={!hasContent || savingMode !== null}
            onClick={() => savePost("draft")}
            className="inline-flex h-10 items-center gap-2 rounded-control border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-primary/30 hover:bg-primary-tint hover:text-primary disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
          >
            {savedMode === "draft" ? <Check className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
            {savingMode === "draft" ? "Saving..." : savedMode === "draft" ? "Draft Saved" : "Save as Draft"}
          </PressableButton>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
              {scheduleEnabled ? <Check className="h-4 w-4 text-emerald-500" /> : <CalendarDays className="h-4 w-4 text-slate-400" />}
              {scheduleLabel}
            </span>
            <PressableButton
              type="button"
              disabled={!scheduleEnabled || !hasContent || savingMode !== null}
              onClick={() => savePost("scheduled")}
              className="inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {savingMode === "scheduled" ? "Scheduling..." : savedMode === "scheduled" ? "Scheduled" : "Schedule Post"}
              {savedMode === "scheduled" ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </PressableButton>
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
