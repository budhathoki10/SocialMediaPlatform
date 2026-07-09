"use client";

import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

type DraftRow = {
  user: string;
  source: string;
  message: string;
  draft: string;
  confidence: string;
  tone: string;
};

type InstagramDraftInboxProps = {
  rows: DraftRow[];
};

export default function InstagramDraftInbox({ rows }: InstagramDraftInboxProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  function handleSelectAll() {
    setSelectedRows(allSelected ? [] : rows.map((row) => row.user));
  }

  function handleSelectRow(user: string) {
    setSelectedRows((currentRows) =>
      currentRows.includes(user) ? currentRows.filter((currentUser) => currentUser !== user) : [...currentRows, user],
    );
  }

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">Draft Inbox</h2>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <div className="flex rounded-md bg-slate-50 p-1 text-xs font-semibold text-slate-500">
            {["All", "Comments", "DMs"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`rounded px-3 py-1.5 ${tab === "All" ? "bg-white text-[#4338ca] shadow-sm" : "hover:text-slate-900"}`}
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
            {rows.map((row) => (
              <tr key={row.user} className="hover:bg-slate-50/70">
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.user)}
                    onChange={() => handleSelectRow(row.user)}
                    className="cursor-pointer rounded border-slate-300"
                    aria-label={`Select ${row.user}`}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="h-6 w-6 rounded-full border border-white bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100 shadow-sm ring-1 ring-slate-200" />
                    {row.user}
                  </span>
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
                      aria-label={`Approve draft from ${row.user}`}
                      title="Approve"
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete draft from ${row.user}`}
                      title="Delete"
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit draft from ${row.user}`}
                      title="Edit"
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Showing 1-6 of 10</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-300"
          >
            Previous
          </button>
          <span className="inline-flex h-10 items-center rounded-lg bg-slate-50 px-4 text-sm font-bold text-slate-700">Page 1 of 2</span>
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm transition hover:border-[#4338ca] hover:text-[#4338ca]"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
