"use client";

import { Activity, AlertTriangle, Bot, CheckCircle2, RefreshCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import EmptyState from "./EmptyState";
import PressableButton from "@/components/motion/PressableButton";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "ai" | "warning";
};

const iconStyles = {
  success: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  ai: "bg-primary-tint text-primary ring-indigo-100",
  warning: "bg-amber-50 text-amber-600 ring-amber-100",
};

const iconMap = {
  success: CheckCircle2,
  ai: Bot,
  warning: AlertTriangle,
};

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-5 px-5 py-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-100 ring-4 ring-slate-50" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-4 w-3/5 animate-pulse rounded bg-slate-100" />
            <span className="block h-3 w-full animate-pulse rounded bg-slate-100" />
            <span className="block h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          </span>
          <span className="h-3 w-10 shrink-0 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function ActivityFeed({ initialItems }: { initialItems: ActivityItem[] }) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshActivity() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/activity/recent", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to refresh activity.");
      }

      setItems(data.items || []);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh activity.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="min-h-[278px] overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-slate-950">Activity Feed</h2>
        </div>
        <PressableButton
          type="button"
          onClick={() => void refreshActivity()}
          disabled={isLoading}
          aria-label="Refresh activity"
          className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </PressableButton>
      </div>

      {isLoading ? (
        <ActivityFeedSkeleton />
      ) : error ? (
        <div className="px-4 py-4">
          <div className="rounded-md border border-red-100 bg-red-50 px-3 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No logs"
          description="Activity logs will appear here when automation runs."
          className="min-h-48"
        />
      ) : (
        <div className="px-5 py-5">
          <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                const Icon = iconMap[item.type];

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    className="relative flex gap-3"
                  >
                    {index < items.length - 1 && <span className="absolute left-4 top-8 h-[calc(100%+10px)] w-px bg-slate-100" />}
                    <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ${iconStyles[item.type]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{item.time}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </section>
  );
}
