"use client";

import { MessageSquare } from "lucide-react";
import { useState } from "react";

import PressableButton from "@/components/motion/PressableButton";

// Static preview of the Draft Inbox WhatsApp will get once a connect flow +
// ConnectedAccount support exist — same table shell as InstagramDraftInbox,
// but there's no data behind it yet, so every tab renders the same empty
// state. Tab switching is purely cosmetic (no filtering to do with zero rows).
const draftTabs = ["All", "DMs", "Replied"] as const;
type DraftTab = (typeof draftTabs)[number];

export default function WhatsAppDraftInboxPreview() {
  const [activeTab, setActiveTab] = useState<DraftTab>("All");
  const isRepliedTab = activeTab === "Replied";

  return (
    <section className="mt-5 overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">Draft Inbox</h2>
        <div className="flex rounded-control bg-slate-50 p-1 text-xs font-semibold text-slate-500">
          {draftTabs.map((tab) => (
            <PressableButton
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer rounded-control px-3 py-1.5 transition ${
                activeTab === tab ? "bg-white text-primary shadow-card" : "hover:text-slate-900"
              }`}
            >
              {tab}
            </PressableButton>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {!isRepliedTab ? (
                <th className="w-10 px-5 py-3">
                  <input type="checkbox" disabled className="rounded border-slate-300" aria-label="Select all drafts" />
                </th>
              ) : null}
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Message Preview</th>
              <th className="px-3 py-3">{isRepliedTab ? "Replied" : "AI Draft Preview"}</th>
              <th className="px-3 py-3">Confidence</th>
              {!isRepliedTab ? <th className="px-5 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={isRepliedTab ? 5 : 7} className="px-5 py-12 text-center">
                <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-control bg-slate-100 text-slate-400">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {isRepliedTab ? "No replies sent in the last 24 hours" : "No unreplied drafts yet"}
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                  {isRepliedTab
                    ? "Recently approved WhatsApp replies will appear here."
                    : "New WhatsApp DM drafts will appear here."}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Showing 0-0 of 0</p>
        <div className="flex items-center gap-3">
          <PressableButton
            type="button"
            disabled
            className="inline-flex h-10 items-center rounded-control border border-slate-200 bg-white px-4 font-semibold text-slate-300 shadow-none"
          >
            Previous
          </PressableButton>
          <span className="inline-flex h-10 items-center rounded-control bg-slate-50 px-4 text-sm font-bold text-slate-700">
            Page 1 of 1
          </span>
          <PressableButton
            type="button"
            disabled
            className="inline-flex h-10 items-center rounded-control border border-slate-200 bg-white px-4 font-semibold text-slate-300 shadow-none"
          >
            Next
          </PressableButton>
        </div>
      </div>
    </section>
  );
}
