"use client";

import { AlertTriangle, Bot, CheckCircle2, RefreshCcw } from "lucide-react";
import { useState } from "react";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "ai" | "warning";
};

const iconStyles = {
  success: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  ai: "bg-indigo-50 text-[#4338ca] ring-indigo-100",
  warning: "bg-amber-50 text-amber-600 ring-amber-100",
};

const iconMap = {
  success: CheckCircle2,
  ai: Bot,
  warning: AlertTriangle,
};

export default function ActivityFeed({ initialItems }: { initialItems: ActivityItem[] }) {
  const [items, setItems] = useState(initialItems);

  return (
    <section className="min-h-[278px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-[#4338ca]" />
          <h2 className="text-sm font-bold text-slate-950">Activity Feed</h2>
        </div>
        <button
          type="button"
          onClick={() => setItems([])}
          className="text-xs font-bold text-[#4338ca] transition hover:text-[#3730a3]"
        >
          Clear Logs
        </button>
      </div>

      {items.length === 0 ? (
        <div className="grid min-h-48 place-items-center px-5 text-center">
          <div>
            <p className="text-sm font-semibold text-slate-700">No logs</p>
            <p className="mt-1 text-xs text-slate-500">Activity logs will appear here when automation runs.</p>
          </div>
        </div>
      ) : (
        <div className="px-5 py-5">
          <div className="space-y-5">
            {items.map((item, index) => {
              const Icon = iconMap[item.type];

              return (
                <div key={item.id} className="relative flex gap-3">
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
