"use client";

import { RefreshCw, Newspaper, X } from "lucide-react";
import { useState } from "react";

const techNews = [
  {
    category: "AI Hardware",
    title: "NVIDIA unveils new Blackwell architecture for AI workloads",
    description: "A major leap in processing power for next-gen automation and model serving.",
  },
  {
    category: "Cloud Computing",
    title: "Azure adds global edge nodes for lower latency apps",
    description: "Developers can now deploy closer to users globally with faster response times.",
  },
];

type TechNews = (typeof techNews)[number];

export default function RecentTechNewsPanel() {
  const [selectedNews, setSelectedNews] = useState<TechNews | null>(null);

  return (
    <>
      <section className="min-h-[278px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-[#4338ca]" />
            <h2 className="text-sm font-bold text-slate-950">Recent Tech News</h2>
          </div>
          <button
            type="button"
            aria-label="Refresh tech news"
            className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-[#4338ca]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 px-4 py-4">
          {techNews.map((news) => (
            <article key={news.title} className="rounded-md border border-transparent transition hover:border-slate-200 hover:bg-slate-50">
              <button type="button" onClick={() => setSelectedNews(news)} className="flex w-full gap-3 px-3 py-3 text-left">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-indigo-50 text-[#4338ca]">
                  <Newspaper className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#4338ca]">{news.category}</span>
                  <span className="mt-1 block line-clamp-1 text-sm font-bold text-slate-800">{news.title}</span>
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-500">{news.description}</span>
                </span>
              </button>
              <div className="px-3 pb-3 pl-[68px]">
                <button type="button" className="h-7 rounded-md bg-[#4338ca] px-3 text-xs font-bold text-white transition hover:bg-[#3730a3]">
                  Post This
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedNews && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#4338ca]">{selectedNews.category}</p>
                <h2 className="mt-1 text-base font-bold text-slate-950">{selectedNews.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                aria-label="Close news preview"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">{selectedNews.description}</p>
            </div>
            <div className="flex justify-end border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="h-9 rounded-md bg-[#4338ca] px-4 text-sm font-bold text-white transition hover:bg-[#3730a3]"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
