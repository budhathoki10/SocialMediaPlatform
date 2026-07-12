"use client";

import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type DraftRow = {
  id: string;
  externalId: string;
  name: string;
  username: string;
  profilePictureUrl?: string | null;
  source: string;
  message: string;
  draft: string;
  confidence: string;
  tone: string;
  status: string;
  createdAt: string | null;
};

type InstagramDraftInboxProps = {
  rows: DraftRow[];
};

const PAGE_SIZE = 6;
const draftTabs = ["All", "Comments", "DMs"] as const;
type DraftTab = (typeof draftTabs)[number];

export default function InstagramDraftInbox({ rows }: InstagramDraftInboxProps) {
  const [draftRows, setDraftRows] = useState<DraftRow[]>(rows);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<DraftTab>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const filteredRows = draftRows.filter((row) => {
    if (activeTab === "All") {
      return true;
    }

    return row.source === (activeTab === "Comments" ? "Comment" : "DM");
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const pageRows = filteredRows.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const selectedPageRows = pageRows.filter((row) => selectedRows.includes(row.id));
  const allSelected = pageRows.length > 0 && selectedPageRows.length === pageRows.length;
  const showingStart = filteredRows.length === 0 ? 0 : pageStartIndex + 1;
  const showingEnd = Math.min(pageStartIndex + pageRows.length, filteredRows.length);

  useEffect(() => {
    let isMounted = true;

    async function refreshDrafts() {
      try {
        const response = await fetch("/api/socials/instagram/drafts", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { drafts?: DraftRow[] };

        if (isMounted) {
          setDraftRows(data.drafts || []);
          setSelectedRows([]);
        }
      } catch (error) {
        console.error("Unable to refresh Instagram drafts:", error);
      }
    }

    const refreshInterval = window.setInterval(() => void refreshDrafts(), 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };

  }, []);

  function handleSelectAll() {
    const pageIds = pageRows.map((row) => row.id);

    setSelectedRows((currentRows) => {
      if (allSelected) {
        return currentRows.filter((id) => !pageIds.includes(id));
      }

      return [...new Set([...currentRows, ...pageIds])];
    });
  }

  function handleSelectRow(id: string) {
    setSelectedRows((currentRows) =>
      currentRows.includes(id) ? currentRows.filter((currentId) => currentId !== id) : [...currentRows, id],
    );
  }

  function handleTabChange(tab: DraftTab) {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedRows([]);
  }

  console.log("________________________________________________-------")
console.log("draft rows is", draftRows);
  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">Draft Inbox</h2>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <div className="flex rounded-md bg-slate-50 p-1 text-xs font-semibold text-slate-500">
            {draftTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`rounded px-3 py-1.5 transition ${
                  activeTab === tab ? "bg-white text-[#4338ca] shadow-sm" : "hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="cursor-pointer rounded border-slate-300"
                  aria-label="Select all drafts"
                />
              </th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Message Preview</th>
              <th className="px-3 py-3">AI Draft Preview</th>
              <th className="px-3 py-3">Confidence</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <p className="text-sm font-bold text-slate-700">No unreplied drafts yet</p>
                  <p className="mt-1 text-xs text-slate-500">New Instagram DM and comment drafts will appear here.</p>
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      className="cursor-pointer rounded border-slate-300"
                      aria-label={`Select ${row.username}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center gap-2">
                      {row.profilePictureUrl ? (
                        // Instagram profile URLs are short-lived and use dynamic CDN hostnames.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.profilePictureUrl}
                          alt=""
                          className="h-12 w-12 rounded-full border border-white object-cover shadow-sm ring-1 ring-slate-200"
                        />
                      ) : (
                        <span className="h-15 w-15 rounded-full border border-white bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100 shadow-sm ring-1 ring-slate-200" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-slate-700">{row.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-400">{row.username}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{row.source}</span>
                  </td>
                  <td className="max-w-44 truncate px-3 py-3 text-xs text-slate-500">&quot;{row.message}&quot;</td>
                  <td className={`max-w-52 truncate px-3 py-3 text-xs ${row.tone === "bad" ? "italic text-red-500" : "text-slate-500"}`}>
                    &quot;{row.draft}&quot;
                  </td>
                  <td className={`px-3 py-3 text-xs font-bold ${row.tone === "bad" ? "text-red-500" : "text-emerald-500"}`}>
                    {row.confidence}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label={`Approve draft from ${row.username}`}
                        title="Approve"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete draft from ${row.username}`}
                        title="Delete"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit draft from ${row.username}`}
                        title="Edit"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Showing {showingStart}-{showingEnd} of {filteredRows.length}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition hover:border-[#4338ca] hover:text-[#4338ca] disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none disabled:hover:border-slate-200"
          >
            Previous
          </button>
          <span className="inline-flex h-10 items-center rounded-lg bg-slate-50 px-4 text-sm font-bold text-slate-700">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition hover:border-[#4338ca] hover:text-[#4338ca] disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none disabled:hover:border-slate-200"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
