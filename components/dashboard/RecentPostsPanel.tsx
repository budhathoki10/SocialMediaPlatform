"use client";

import { Clock3, MessageSquare, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

import PostShareMenu from "./PostShareMenu";

const POST_RETENTION_MS = 10 * 24 * 60 * 60 * 1000;
const KATHMANDU_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

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

function parseKathmanduDatetimeLocal(value: string) {
  const match = value.match(DATETIME_LOCAL_PATTERN);

  if (!match) return null;

  const [, year, month, day, hour, minute, second = "0"] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );
}

function dateToKathmanduDatetimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

function getCurrentKathmanduDatetimeLocal() {
  return new Date(Date.now() + KATHMANDU_OFFSET_MS).toISOString().slice(0, 16);
}

function getScheduleLimit(post: DashboardPost) {
  const expirationDate = new Date(new Date(post.created_at).getTime() + POST_RETENTION_MS);
  return dateToKathmanduDatetimeLocal(expirationDate.toISOString());
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

export default function RecentPostsPanel() {
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<DashboardPost | null>(null);
  const [content, setContent] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
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
    setScheduledTime(dateToKathmanduDatetimeLocal(post.scheduled_time));
    setSaveError(null);
  }

  function closeEditor() {
    if (!isSaving) {
      setEditingPost(null);
      setSaveError(null);
    }
  }

  async function savePost() {
    if (!editingPost) return;

    const scheduledDate = scheduledTime ? parseKathmanduDatetimeLocal(scheduledTime) : null;
    const scheduleLimit = parseKathmanduDatetimeLocal(getScheduleLimit(editingPost));

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
          scheduled_time: scheduledTime || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save post.");
      }

      setPosts((currentPosts) => currentPosts.map((post) => (post._id === data.post._id ? data.post : post)));
      setEditingPost(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-950">Upcoming Posts</h2>
          <button type="button" className="text-xs font-bold text-[#4338ca] transition hover:text-[#3730a3]">
            View Calendar
          </button>
        </div>

        {isLoadingPosts ? (
          <div className="grid min-h-56 place-items-center px-5 text-center">
            <p className="text-sm font-medium text-slate-500">Loading latest posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-5 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-700">No posts yet</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Generated drafts and scheduled posts will appear here after you create or automate content.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[minmax(0,1fr)_112px_112px_40px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">
              <span>Post Content</span>
              <span>Platform</span>
              <span>Scheduled</span>
              <span className="sr-only">Share</span>
            </div>
            {posts.map((post) => (
              <article key={post._id} className="grid grid-cols-[minmax(0,1fr)_112px_112px_40px] items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                <button
                  type="button"
                  onClick={() => openEditor(post)}
                  className="flex min-w-0 items-start gap-3 text-left"
                  aria-label={`Edit ${post.pr_title || "post"}`}
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-indigo-50 text-[#4338ca]">
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
                <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-[#4338ca]" />
                  {getPlatformLabel(getPrimaryPlatform(post))}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                  {post.scheduled_time ? formatDate(post.scheduled_time) : "No schedule"}
                </span>
                <PostShareMenu
                  postId={post._id}
                  initialSharedPlatforms={post.shared_platforms}
                  onPostPublished={() => setPosts((currentPosts) => currentPosts.map((item) => item._id === post._id ? { ...item, status: "published" } : item))}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      {editingPost && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="edit-post-title" className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">PR</p>
                <h2 id="edit-post-title" className="mt-1 truncate text-base font-bold text-slate-950">{editingPost.pr_title || "Edit post"}</h2>
              </div>
              <button type="button" onClick={closeEditor} aria-label="Close editor" className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Content</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={6}
                  className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Schedule</span>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(event) => setScheduledTime(event.target.value)}
                  min={getCurrentKathmanduDatetimeLocal()}
                  max={getScheduleLimit(editingPost)}
                  className="mt-2 block h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1.5 text-xs text-slate-500">Leave empty for no schedule. Posts are kept for 10 days.</p>
              </label>

              {saveError && <p className="text-sm font-medium text-red-600">{saveError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
              <button type="button" onClick={closeEditor} disabled={isSaving} className="h-9 rounded-md px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={() => void savePost()} disabled={isSaving} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#4338ca] px-4 text-sm font-bold text-white hover:bg-[#3730a3] disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving" : "Save changes"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
