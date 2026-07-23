"use client";

import { Clock3, FileText, MessageSquare, Save, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

import EmptyState from "./EmptyState";
import HoverCard from "@/components/motion/HoverCard";
import { ModalBackdrop, ModalPanel } from "@/components/motion/Modal";
import PressableButton from "@/components/motion/PressableButton";
import PressableLink from "@/components/motion/PressableLink";
import PostShareMenu from "./PostShareMenu";
import {
  dateToKathmanduDatetimeLocal,
  getCurrentKathmanduDatetimeLocal,
  getScheduleLimit,
  parseKathmanduDatetimeLocal,
} from "@/lib/client/post-schedule";

type DashboardPost = {
  _id: string;
  content: string;
  pr_title?: string | null;
  pr_body?: string | null;
  status: "draft" | "scheduled" | "published" | "failed" | "cancelled";
  scheduled_time: string | null;
  created_at: string;
  source: string;
  shared_platforms: string[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function getPostStatusClasses(status: DashboardPost["status"]) {
  const styles = {
    draft: "bg-slate-100 text-slate-600",
    scheduled: "bg-blue-50 text-blue-700",
    published: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
    cancelled: "bg-amber-50 text-amber-700",
  };

  return styles[status];
}

function getPostStatusLabel(status: DashboardPost["status"]) {
  return status === "published" ? "posted" : status;
}

function getPrimaryPlatform(post: DashboardPost) {
  return post.shared_platforms[0] || "linkedin";
}

function getPlatformLabel(platform: string) {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
  };

  return labels[platform] || platform;
}

function UpcomingPostsSkeleton() {
  return (
    <div aria-label="Loading upcoming posts" aria-busy="true">
      <div className="hidden grid-cols-[minmax(0,1fr)_112px_128px_40px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 md:grid">
        <span className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <span className="h-3 w-16 animate-pulse rounded bg-slate-200" />
        <span className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        <span className="sr-only">Share</span>
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_112px_128px_40px] md:items-center md:gap-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 h-10 w-10 shrink-0 animate-pulse rounded-control bg-primary-tint" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-5 w-14 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function RecentPostsPanel({ hasConnectedAccounts }: { hasConnectedAccounts: boolean }) {
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<DashboardPost | null>(null);
  const [content, setContent] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLatestPosts() {
      try {
        const response = await fetch("/api/posts/recent", { cache: "no-store" });
        const data = await response.json();

        if (response.ok && isMounted) {
          setPosts(data.posts);
        }
      } catch {
        // Leave the most recently fetched posts visible if a refresh fails.
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    }

    void loadLatestPosts();
    const refreshInterval = window.setInterval(() => void loadLatestPosts(), 15_000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  function openEditor(post: DashboardPost) {
    setEditingPost(post);
    setContent(post.content);
    setPrTitle(post.pr_title || "");
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

      setPosts((currentPosts) =>
        currentPosts.map((post) => (post._id === data.post._id ? { ...post, ...data.post } : post)),
      );
      setEditingPost(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-950">Upcoming Posts</h2>
        </div>

        {isLoadingPosts ? (
          <UpcomingPostsSkeleton />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No posts yet"
            className="min-h-56"
            description={
              hasConnectedAccounts
                ? "Generated drafts and scheduled posts will appear here after you create or automate content."
                : "Connect a social media account to start generating and scheduling posts."
            }
            action={
              !hasConnectedAccounts && (
                <PressableLink
                  href="/onboarding"
                  className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-bold text-white transition hover:bg-primary-hover"
                >
                  Connect a platform
                </PressableLink>
              )
            }
          />
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(0,1fr)_112px_128px_40px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 md:grid">
              <span>Post Content</span>
              <span>Platform</span>
              <span>Scheduled</span>
              <span className="sr-only">Share</span>
            </div>
            <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <HoverCard
                as="article"
                key={post._id}
                layout
                liftPx={2}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24 }}
                className="grid gap-3 border-b border-slate-100 px-5 py-4 transition last:border-b-0 hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_112px_128px_40px] md:items-center md:gap-4"
              >
                <button
                  type="button"
                  onClick={() => openEditor(post)}
                  className="flex min-w-0 items-start gap-3 text-left"
                  aria-label={`Edit ${post.pr_title || "post"}`}
                >
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-slate-900">{post.pr_title || "Generated post"}</h3>
                    <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">{post.content}</p>
                    <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${getPostStatusClasses(post.status)}`}>
                      {getPostStatusLabel(post.status)}
                    </span>
                  </div>
                </button>
                <div className="flex flex-wrap items-center gap-3 md:contents">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {getPlatformLabel(getPrimaryPlatform(post))}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                    {post.scheduled_time ? formatDate(post.scheduled_time) : "No schedule"}
                  </span>
                </div>
                <PostShareMenu
                  postId={post._id}
                  initialSharedPlatforms={post.shared_platforms}
                  onPostPublished={() => setPosts((currentPosts) => currentPosts.map((item) => item._id === post._id ? { ...item, status: "published" } : item))}
                />
              </HoverCard>
            ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <AnimatePresence>
      {editingPost && (
        <ModalBackdrop className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="presentation">
          <ModalPanel role="dialog" aria-modal="true" aria-labelledby="edit-post-title" className="w-full max-w-xl rounded-panel border border-slate-200 bg-white shadow-panel">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">PR</p>
                <h2 id="edit-post-title" className="mt-1 truncate text-base font-bold text-slate-950">{prTitle || "Edit post"}</h2>
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
                  max={getScheduleLimit(editingPost.created_at)}
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
