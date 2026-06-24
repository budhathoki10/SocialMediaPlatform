"use client";

import { CalendarDays, MessageSquare, Save, X } from "lucide-react";
import { useState } from "react";

import PostShareMenu from "./PostShareMenu";

const POST_RETENTION_MS = 10 * 24 * 60 * 60 * 1000;

export type DashboardPost = {
  _id: string;
  content: string;
  pr_title?: string | null;
  pr_body?: string | null;
  status: "draft" | "scheduled" | "published" | "failed" | "cancelled";
  scheduled_time: string | null;
  created_at: string;
  source: string;
};

type RecentPostsPanelProps = {
  initialPosts: DashboardPost[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDatetimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function getScheduleLimit(post: DashboardPost) {
  const expirationDate = new Date(new Date(post.created_at).getTime() + POST_RETENTION_MS);
  return getDatetimeLocalValue(expirationDate.toISOString());
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

export default function RecentPostsPanel({ initialPosts }: RecentPostsPanelProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [editingPost, setEditingPost] = useState<DashboardPost | null>(null);
  const [content, setContent] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function openEditor(post: DashboardPost) {
    setEditingPost(post);
    setContent(post.content);
    setScheduledTime(getDatetimeLocalValue(post.scheduled_time));
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

    if (scheduledTime && new Date(scheduledTime).getTime() > new Date(getScheduleLimit(editingPost)).getTime()) {
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
          scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : null,
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
          <div>
            <h2 className="text-sm font-bold text-slate-950">Recent Posts</h2>
            <p className="mt-0.5 text-xs text-slate-500">Your three latest generated, draft, and scheduled posts.</p>
          </div>
          <CalendarDays className="h-4 w-4 text-slate-400" />
        </div>

        {posts.length === 0 ? (
          <div className="grid min-h-36 place-items-center px-5 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-700">No posts yet</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Generated drafts and scheduled posts will appear here after you create or automate content.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <article key={post._id} className="flex items-start gap-3 px-5 py-4 sm:gap-4">
                <button
                  type="button"
                  onClick={() => openEditor(post)}
                  className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-indigo-50 text-[#4338ca] transition hover:bg-indigo-100"
                  aria-label={`Edit ${post.pr_title || "post"}`}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => openEditor(post)} className="min-w-0 flex-1 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">PR</p>
                  <h3 className="mt-1 truncate text-sm font-bold text-slate-900">{post.pr_title || "Generated post"}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{post.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${getPostStatusClasses(post.status)}`}>{post.status}</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {post.scheduled_time ? formatDate(post.scheduled_time) : "No schedule"}
                    </span>
                  </div>
                </button>
                <PostShareMenu postId={post._id} />
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
                  min={getDatetimeLocalValue(new Date().toISOString())}
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
