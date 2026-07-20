"use client";

import { CalendarClock, CheckCircle2, Clock3, FileText, MessageSquare, Newspaper } from "lucide-react";
import Image from "next/image";
import { AnimatePresence } from "motion/react";

import EmptyState from "./EmptyState";
import HoverCard from "@/components/motion/HoverCard";
import { DURATION, MOTION_EASE, STAGGER } from "@/lib/motion/tokens";

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

function ContentPreview({ post }: { post: ScheduledPost }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
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
    </div>
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
  if (rows.length === 0) {
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
    <div className="space-y-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {rows.map(({ post, platform }, index) => {
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
              <ContentPreview post={post} />
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
  );
}
