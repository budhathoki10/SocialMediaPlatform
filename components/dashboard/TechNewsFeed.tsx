"use client";

import { ExternalLink, ImageIcon, Search, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

type NewsArticle = {
  article_id?: string;
  category?: string[];
  country?: string[];
  description?: string | null;
  image_url?: string | null;
  language?: string;
  link?: string;
  pubDate?: string;
  source_id?: string;
  source_name?: string;
  title?: string;
};

const PAGE_SIZE = 6;

function formatDate(value?: string) {
  if (!value) return { date: "Unknown", time: "Unknown" };

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const [datePart, timePart] = value.split(" ");
    return {
      date: datePart || "Unknown",
      time: timePart || "Unknown",
    };
  }

  return {
    date: new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kathmandu",
    }).format(date),
    time: new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kathmandu",
    }).format(date),
  };
}

function listValue(value?: string[]) {
  return value?.filter(Boolean).join(", ") || "Unknown";
}

function publisherName(news: NewsArticle) {
  return news.source_name || news.source_id || "Unknown";
}

function NewsImage({ src, size = "table" }: { src?: string | null; size?: "table" | "modal" }) {
  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400">
        <ImageIcon className={size === "modal" ? "h-8 w-8" : "h-5 w-5"} />
        <span className="text-[10px] font-bold uppercase tracking-[0.08em]">No image</span>
      </div>
    );
  }

  return <Image src={src} alt="" fill sizes={size === "modal" ? "768px" : "128px"} className="object-cover" unoptimized />;
}

function NewsSkeleton() {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[2.3fr_0.85fr_0.95fr_0.75fr_0.9fr_0.8fr_1.2fr] items-center gap-4 bg-[#114a86] px-4 py-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <span key={index} className="h-3 w-20 animate-pulse rounded bg-white/35" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[2.3fr_0.85fr_0.95fr_0.75fr_0.9fr_0.8fr_1.2fr] items-center gap-4 border-b border-slate-200 px-4 py-4 last:border-b-0"
        >
          <div className="flex items-center gap-4">
            <span className="h-20 w-32 shrink-0 animate-pulse rounded-md bg-slate-100" />
            <span className="h-4 w-40 animate-pulse rounded bg-slate-100" />
          </div>
          {Array.from({ length: 6 }).map((__, itemIndex) => (
            <span key={itemIndex} className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TechNewsFeed() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("AI Agents");
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [selectedNewsImage, setSelectedNewsImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(newsItems.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleNewsItems = newsItems.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/news?q=${encodeURIComponent(searchedQuery)}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to fetch news.");
        }

        if (isMounted) {
          setNewsItems(data.results || []);
          setCurrentPage(1);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to fetch news.");
          setNewsItems([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadNews();

    return () => {
      isMounted = false;
    };
  }, [searchedQuery]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim() || "AI Agents";
    setQuery(nextQuery);
    setSearchedQuery(nextQuery);
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">News Feed</h1>
          <p className="mt-1 text-sm text-slate-500">Curated technology updates ready to turn into social posts.</p>
          <form onSubmit={handleSearch} className="mt-4 flex w-full max-w-3xl items-center gap-2">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 shadow-sm">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search news by keyword: AI Agents"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <button className="h-9 rounded-lg bg-[#4338ca] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#3730a3] cursor-pointer">
              Search
            </button>
          </form>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#4338ca]" />
            All News
          </div>
        </div>
      </div>

      {isLoading ? (
        <NewsSkeleton />
      ) : error ? (
        <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : newsItems.length === 0 ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-800">No news found</p>
          <p className="mt-1 text-xs text-slate-500">Try a different keyword.</p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="w-full">
            <div className="w-full">
              <div className="grid grid-cols-[2.3fr_0.85fr_0.95fr_0.75fr_0.9fr_0.8fr_1.2fr] items-center gap-4 bg-[#114a86] px-4 py-4 text-sm font-bold text-white">
                <div>News</div>
                <div>
                  Date<span className="text-[10px] font-semibold"></span>
                </div>
                <div>Country</div>
                <div>Language</div>
                <div>Category</div>
                <div>Publisher</div>
                <div>Description</div>
              </div>

              {visibleNewsItems.map((news, index) => {
                const publishedAt = formatDate(news.pubDate);
                const imageSource = news.image_url || null;

                return (
                  <article
                    key={news.article_id || news.link || `${news.title}-${index}`}
                    onClick={() => {
                      setSelectedNews(news);
                      setSelectedNewsImage(imageSource);
                    }}
                    className="grid cursor-pointer grid-cols-[2.3fr_0.85fr_0.95fr_0.75fr_0.9fr_0.8fr_1.2fr] items-center gap-4 border-b border-slate-200 px-4 py-4 transition-colors last:border-b-0 hover:bg-blue-50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-slate-100">
                        <NewsImage src={imageSource} />
                      </div>
                      <h2 className="line-clamp-3 text-[13px] font-extrabold leading-5 text-slate-950">
                        {news.title || "Untitled news"}
                      </h2>
                    </div>

                    <div className="text-xs leading-5 text-slate-950">
                      <p>{publishedAt.date}</p>
                      <p>{publishedAt.time}</p>
                    </div>
                    <div className="text-xs capitalize leading-5 text-slate-950">{listValue(news.country)}</div>
                    <div className="text-xs capitalize text-slate-950">{news.language || "Unknown"}</div>
                    <div className="text-xs capitalize leading-5 text-slate-950">{listValue(news.category)}</div>
                    <div className="text-xs capitalize text-slate-950">{publisherName(news)}</div>
                    <div className="line-clamp-3 text-[11px] font-semibold uppercase leading-4 text-slate-950">
                      {news.description || "No description available."}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">
              Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, newsItems.length)} of {newsItems.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50  cursor-pointer"
              >
                Previous
              </button>
              <span className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedNews && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-detail-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4338ca]">
                  {publisherName(selectedNews)}
                </p>
                <h2 id="news-detail-title" className="mt-2 line-clamp-2 text-xl font-extrabold leading-7 text-slate-950">
                  {selectedNews.title || "Untitled news"}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
                  <span>{formatDate(selectedNews.pubDate).date}</span>
                  <span className="text-slate-300">•</span>
                  <span>{formatDate(selectedNews.pubDate).time}</span>
                  <span className="text-slate-300">•</span>
                  <span className="capitalize">{listValue(selectedNews.country)}</span>
                  <span className="text-slate-300">•</span>
                  <span className="capitalize">{selectedNews.language || "Unknown"}</span>
                  <span className="text-slate-300">•</span>
                  <span className="capitalize">{listValue(selectedNews.category)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                aria-label="Close news detail"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-91px)] overflow-y-auto">
              <div className="bg-slate-50 px-6 py-5">
                <div className="relative h-64 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <NewsImage src={selectedNewsImage} size="modal" />
                </div>
              </div>

              <div className="space-y-5 px-6 pb-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Description</p>
                  <p className="mt-3 text-base leading-7 text-slate-700">
                    {selectedNews.description || "No description available for this news item."}
                  </p>
                </div>

                {selectedNews.link && (
                  <a
                    href={selectedNews.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-[#4338ca] hover:bg-[#4338ca] hover:text-white"
                  >
                    Read original
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
