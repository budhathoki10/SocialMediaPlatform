"use client";

import { ExternalLink, Newspaper, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

type NewsArticle = {
  article_id?: string;
  category?: string[];
  country?: string[];
  description?: string | null;
  language?: string;
  link?: string;
  pubDate?: string;
  source_id?: string;
  source_name?: string;
  title?: string;
};

function publisherName(news: NewsArticle) {
  return news.source_name || news.source_id || "Unknown";
}

function categoryName(news: NewsArticle) {
  return news.category?.filter(Boolean).join(", ") || "All News";
}

function formatDate(value?: string) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kathmandu",
  }).format(date);
}

function NewsPanelSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-md border border-slate-100 px-3 py-3">
          <span className="h-11 w-11 shrink-0 animate-pulse rounded-md bg-slate-100" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-20 animate-pulse rounded bg-slate-100" />
            <span className="block h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            <span className="block h-3 w-full animate-pulse rounded bg-slate-100" />
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RecentTechNewsPanel() {
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRecentNews() {
    const response = await fetch("/api/news?q=AI%20Agents");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to fetch news.");
    }

    return (data.results || []).slice(0, 2);
  }

  async function refreshNews() {
    setIsLoading(true);
    setError(null);

    try {
      setNewsItems(await fetchRecentNews());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to fetch news.");
      setNewsItems([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialNews() {
      try {
        const nextNews = await fetchRecentNews();
        if (isMounted) setNewsItems(nextNews);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to fetch news.");
          setNewsItems([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadInitialNews();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <section className="min-h-[278px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-[#4338ca]" />
            <h2 className="text-sm font-bold text-slate-950">Recent News Feed</h2>
          </div>
          <button
            type="button"
            onClick={() => void refreshNews()}
            aria-label="Refresh news"
            className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-[#4338ca]"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoading ? (
          <NewsPanelSkeleton />
        ) : error ? (
          <div className="px-4 py-4">
            <div className="rounded-md border border-red-100 bg-red-50 px-3 py-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="grid min-h-36 place-items-center px-5 text-center">
            <div>
              <p className="text-sm font-semibold text-slate-700">No recent news</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Try refreshing the feed.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 px-4 py-4">
            {newsItems.map((news, index) => (
              <article
                key={news.article_id || news.link || `${news.title}-${index}`}
                className="rounded-md border border-transparent transition hover:border-blue-100 hover:bg-blue-50"
              >
                <button type="button" onClick={() => setSelectedNews(news)} className="flex w-full gap-3 px-3 py-3 text-left">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-indigo-50 text-[#4338ca]">
                    <Newspaper className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#4338ca]">
                      {categoryName(news)}
                    </span>
                    <span className="mt-1 block line-clamp-1 text-sm font-bold text-slate-800">{news.title || "Untitled news"}</span>
                    <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-500">
                      {news.description || "No description available."}
                    </span>
                    <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      {publisherName(news)} • {formatDate(news.pubDate)}
                    </span>
                  </span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedNews && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#4338ca]">{publisherName(selectedNews)}</p>
                <h2 className="mt-1 text-base font-bold text-slate-950">{selectedNews.title || "Untitled news"}</h2>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {formatDate(selectedNews.pubDate)} • {categoryName(selectedNews)}
                </p>
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
              <p className="text-sm leading-6 text-slate-600">{selectedNews.description || "No description available."}</p>
            </div>
            <div className="flex justify-between gap-3 border-t border-slate-100 px-5 py-4">
              {selectedNews.link ? (
                <a
                  href={selectedNews.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:border-[#4338ca] hover:bg-[#4338ca] hover:text-white"
                >
                  Read original
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span />
              )}
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
