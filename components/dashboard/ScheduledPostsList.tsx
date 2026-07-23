"use client";

import { CalendarClock, CheckCircle2, Clock3, FileText, MessageSquare, Newspaper, Save, X } from "lucide-react";
import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { useState } from "react";

import EmptyState from "./EmptyState";
import HoverCard from "@/components/motion/HoverCard";
import { ModalBackdrop, ModalPanel } from "@/components/motion/Modal";
import PressableButton from "@/components/motion/PressableButton";
import { DURATION, MOTION_EASE, STAGGER } from "@/lib/motion/tokens";
import {
  dateToKathmanduDatetimeLocal,
  getCurrentKathmanduDatetimeLocal,
  getScheduleLimit,
  parseKathmanduDatetimeLocal,
} from "@/lib/client/post-schedule";

export type ScheduledPost = {
  _id: string;
  content: string;
  pr_title?: string | null;
  media_url?: string | null;
  status: "draft" | "scheduled" | "published" | "failed" | "cancelled";
  scheduled_time?: Date | null;
  created_at: Date;
  source: string;
};

type ScheduledPostRow = { post: ScheduledPost; platform: string };

type PostPatchResponse = {
  _id: string;
  content: string;
  pr_title?: string | null;
  pr_body?: string | null;
  status: ScheduledPost["status"];
  scheduled_time: string | null;
  created_at: string;
  source: string;
};

const platformImages: Record<string, string> = {
  github: "/landing/githubs.png",
  linkedin: "/landing/linkedin.png",
  instagram: "/landing/insta.png",
  facebook: "/landing/facebook.png",
  gmail: "/landing/gmail.png",
};

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  github: "GitHub",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter (X)",
  x: "Twitter (X)",
};

function formatDateParts(value?: Date | null) {
  if (!value) return { date: "No schedule", time: "Not set" };

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return { date: "No schedule", time: "Not set" };

  return {
    date: new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
    time: new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date),
  };
}

function statusClasses(status: ScheduledPost["status"]) {
  const styles = {
    cancelled: "bg-amber-50 text-amber-700",
    draft: "bg-slate-100 text-slate-600",
    failed: "bg-red-50 text-red-700",
    published: "bg-emerald-50 text-emerald-700",
    scheduled: "bg-blue-50 text-blue-700",
  };

  return styles[status] || styles.draft;
}

function StatusIcon({ status }: { status: ScheduledPost["status"] }) {
  if (status === "published") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "scheduled") return <Clock3 className="h-3.5 w-3.5" />;
  if (status === "draft") return <FileText className="h-3.5 w-3.5" />;

  return null;
}

function PlatformBadge({ platform }: { platform: string }) {
  const imageSource = platformImages[platform];

  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-control bg-slate-100">
        {imageSource ? (
          <Image src={imageSource} alt="" width={18} height={18} className="h-4.5 w-4.5 object-contain" />
        ) : (
          <span className="text-[10px] font-black uppercase text-slate-500">{platform.slice(0, 2)}</span>
        )}
      </span>
      {platformLabels[platform] || platform}
    </span>
  );
}

function ContentPreview({ post, onClick }: { post: ScheduledPost; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-3 text-left" aria-label={`Edit ${post.pr_title || "post"}`}>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-control bg-slate-100">
        {post.media_url ? (
          <Image src={post.media_url} alt="" fill sizes="48px" className="object-cover" unoptimized />
        ) : (
          <span className="grid h-full w-full place-items-center text-slate-500">
            {post.source === "tech_news" ? <Newspaper className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{post.pr_title || "Generated post"}</p>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{post.content}</p>
      </div>
    </button>
  );
}

/**
 * List rendering split into a client component so a search/filter/page
 * change (which re-runs the server page with new searchParams) can still
 * get an AnimatePresence-driven exit/enter transition for rows that leave
 * or join the result set, instead of the table just snapping to new
 * content on every navigation.
 */
export default function ScheduledPostsList({ rows }: { rows: ScheduledPostRow[] }) {
  const [localRows, setLocalRows] = useState(rows);
  const [previousRows, setPreviousRows] = useState(rows);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [prTitle, setPrTitle] = useState("");
  const [content, setContent] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // New searchParams from the server means a genuinely new `rows` prop —
  // adopt it during render (React's documented pattern for resetting
  // derived state) instead of a useEffect, so local PATCH edits made via
  // the modal aren't clobbered by every re-render, only by real navigation.
  if (rows !== previousRows) {
    setPreviousRows(rows);
    setLocalRows(rows);
  }

  function openEditor(post: ScheduledPost) {
    setEditingPost(post);
    setPrTitle(post.pr_title || "");
    setContent(post.content);
    setScheduledTime(dateToKathmanduDatetimeLocal(post.scheduled_time));
    setSaveError(null);
  }

  function closeEditor() {
    if (!isSaving) {
      setEditingPost(null);
      setSaveError(null);
    }
  }

  const scheduledDateValue = scheduledTime ? parseKathmanduDatetimeLocal(scheduledTime) : null;
  const nowValue = parseKathmanduDatetimeLocal(getCurrentKathmanduDatetimeLocal());
  const scheduleLimitValue = editingPost ? parseKathmanduDatetimeLocal(getScheduleLimit(editingPost.created_at)) : null;
  const scheduleHint =
    scheduledDateValue && nowValue && scheduledDateValue.getTime() < nowValue.getTime()
      ? "Scheduled time can't be in the past."
      : scheduledDateValue && scheduleLimitValue && scheduledDateValue.getTime() > scheduleLimitValue.getTime()
        ? "Posts can only be scheduled within 10 days of being created."
        : null;

  async function savePost() {
    if (!editingPost) return;

    const scheduledDate = scheduledTime ? parseKathmanduDatetimeLocal(scheduledTime) : null;
    const now = parseKathmanduDatetimeLocal(getCurrentKathmanduDatetimeLocal());
    const scheduleLimit = parseKathmanduDatetimeLocal(getScheduleLimit(editingPost.created_at));

    if (scheduledDate && now && scheduledDate.getTime() < now.getTime()) {
      setSaveError("Scheduled time can't be in the past.");
      return;
    }

    if (scheduledDate && scheduleLimit && scheduledDate.getTime() > scheduleLimit.getTime()) {
      setSaveError("Posts can only be scheduled within 10 days of being created.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/posts/${editingPost._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          pr_title: prTitle,
          scheduled_time: scheduledTime || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save post.");
      }

      const updated: PostPatchResponse = data.post;

      setLocalRows((currentRows) =>
        currentRows.map((row) =>
          row.post._id === updated._id
            ? {
                ...row,
                post: {
                  ...row.post,
                  content: updated.content,
                  pr_title: updated.pr_title,
                  status: updated.status,
                  scheduled_time: updated.scheduled_time ? new Date(updated.scheduled_time) : null,
                  created_at: new Date(updated.created_at),
                },
              }
            : row,
        ),
      );
      setEditingPost(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setIsSaving(false);
    }
  }

  if (localRows.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No posts found"
        description="Scheduled, draft, and published posts will appear here."
        className="min-h-64 rounded-card border border-slate-200 bg-white shadow-card"
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {localRows.map(({ post, platform }, index) => {
            const scheduled = formatDateParts(post.scheduled_time || post.created_at);

            return (
              <HoverCard
                as="article"
                key={post._id.toString()}
                liftPx={2}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * STAGGER.tight, duration: DURATION.slow, ease: MOTION_EASE.outExpo },
                }}
                exit={{ opacity: 0, x: 24 }}
                className="grid gap-4 rounded-card border border-slate-200 bg-white px-5 py-4 shadow-card transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_150px_150px_126px] md:items-center"
              >
                <ContentPreview post={post} onClick={() => openEditor(post)} />
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 md:hidden">Platform</p>
                  <PlatformBadge platform={platform} />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 md:hidden">Scheduled Date</p>
                  <div className="inline-flex items-start gap-2 text-sm font-semibold text-slate-700">
                    <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
                    <span>
                      <span className="block">{scheduled.date}</span>
                      <span className="mt-0.5 block text-xs font-medium text-slate-500">{scheduled.time}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 md:hidden">Status</p>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClasses(post.status)}`}>
                    <StatusIcon status={post.status} />
                    {post.status === "published" ? "Published" : post.status}
                  </span>
                </div>
              </HoverCard>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editingPost && (
          <ModalBackdrop className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="presentation">
            <ModalPanel role="dialog" aria-modal="true" aria-labelledby="edit-scheduled-post-title" className="w-full max-w-xl rounded-panel border border-slate-200 bg-white shadow-panel">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">PR</p>
                  <h2 id="edit-scheduled-post-title" className="mt-1 truncate text-base font-bold text-slate-950">{prTitle || "Edit post"}</h2>
                </div>
                <PressableButton type="button" onClick={closeEditor} aria-label="Close editor" className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </PressableButton>
              </div>

              <div className="space-y-5 px-5 py-5">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">Heading</span>
                  <input
                    type="text"
                    value={prTitle}
                    onChange={(event) => setPrTitle(event.target.value)}
                    placeholder="Generated post"
                    className="mt-2 block h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">Content</span>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={6}
                    className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">Schedule</span>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(event) => setScheduledTime(event.target.value)}
                    min={getCurrentKathmanduDatetimeLocal()}
                    max={editingPost ? getScheduleLimit(editingPost.created_at) : undefined}
                    aria-invalid={Boolean(scheduleHint)}
                    className={`mt-2 block h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-2 ${
                      scheduleHint
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-primary focus:ring-primary/15"
                    }`}
                  />
                  <p className={`mt-1.5 text-xs ${scheduleHint ? "font-semibold text-red-600" : "text-slate-500"}`}>
                    {scheduleHint || "Leave empty for no schedule. Posts are kept for 10 days."}
                  </p>
                </label>

                {saveError && <p className="text-sm font-medium text-red-600">{saveError}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
                <PressableButton type="button" onClick={closeEditor} disabled={isSaving} className="h-9 rounded-md px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                  Cancel
                </PressableButton>
                <PressableButton type="button" onClick={() => void savePost()} disabled={isSaving || Boolean(scheduleHint)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving" : "Save changes"}
                </PressableButton>
              </div>
            </ModalPanel>
          </ModalBackdrop>
        )}
      </AnimatePresence>
    </>
  );
}
