"use client";

import { CheckCircle2, ChevronDown, LoaderCircle, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useState } from "react";

import PressableButton from "@/components/motion/PressableButton";
import { DURATION, SPRING } from "@/lib/motion/tokens";

type DraftRow = {
  id: string;
  externalId: string;
  name: string;
  username: string;
  profilePictureUrl?: string | null;
  source: string;
  message: string;
  draft: string;
  tone: string;
  status: string;
  createdAt: string | null;
  sentAt: string | null;
};

type MessageGroup = {
  key: string;
  name: string;
  username: string;
  profilePictureUrl?: string | null;
  source: string;
  messages: DraftRow[];
};

type InstagramDraftInboxProps = {
  rows: DraftRow[];
};

const PAGE_SIZE = 6;
const draftTabs = ["All", "Comments", "DMs", "Replied"] as const;
type DraftTab = (typeof draftTabs)[number];

// Same sender + same source (DM or Comment) collapse into one conversation row.
// A sender who has messaged in both a DM and a comment gets two separate rows.
function groupRowsByConversation(rows: DraftRow[]): MessageGroup[] {
  const groups = new Map<string, MessageGroup>();

  for (const row of rows) {
    const key = `${row.username}__${row.source}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.messages.push(row);

      if (row.profilePictureUrl) {
        existingGroup.profilePictureUrl = row.profilePictureUrl;
      }

      if (row.name) {
        existingGroup.name = row.name;
      }

      continue;
    }

    groups.set(key, {
      key,
      name: row.name,
      username: row.username,
      profilePictureUrl: row.profilePictureUrl,
      source: row.source,
      messages: [row],
    });
  }

  return [...groups.values()];
}

export default function InstagramDraftInbox({ rows }: InstagramDraftInboxProps) {
  const [draftRows, setDraftRows] = useState<DraftRow[]>(rows);
  // this state is used to track which rows are selected for bulk actions. It stores the IDs of the selected drafts.
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<DraftTab>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"approve" | "reject" | "edit" | null>(null);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftEditValue, setDraftEditValue] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const isRepliedTab = activeTab === "Replied";
  const filteredRows = draftRows.filter((row) => {
    if (isRepliedTab) {
      return row.status === "sent" || row.status === "approved";
    }

    if (activeTab === "All") {
      return row.status === "pending";
    }

    return row.status === "pending" && row.source === (activeTab === "Comments" ? "Comment" : "DM");
  });
  const filteredGroups = groupRowsByConversation(filteredRows);
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const pageGroups = filteredGroups.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const pageMessageIds = pageGroups.flatMap((group) => group.messages.map((message) => message.id));
  const selectedPageIds = pageMessageIds.filter((id) => selectedRows.includes(id));
  const allSelected = pageMessageIds.length > 0 && selectedPageIds.length === pageMessageIds.length;
  const showingStart = filteredGroups.length === 0 ? 0 : pageStartIndex + 1;
  const showingEnd = Math.min(pageStartIndex + pageGroups.length, filteredGroups.length);

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
    setSelectedRows((currentRows) => {
      if (allSelected) {
        return currentRows.filter((id) => !pageMessageIds.includes(id));
      }

      return [...new Set([...currentRows, ...pageMessageIds])];
    });
  }

  function handleSelectRow(id: string) {
    setSelectedRows((currentRows) =>
      currentRows.includes(id) ? currentRows.filter((currentId) => currentId !== id) : [...currentRows, id],
    );
  }

  function isGroupSelected(group: MessageGroup) {
    return group.messages.every((message) => selectedRows.includes(message.id));
  }

  function handleSelectGroup(group: MessageGroup) {
    const messageIds = group.messages.map((message) => message.id);
    const groupFullySelected = messageIds.every((id) => selectedRows.includes(id));

    setSelectedRows((currentRows) => {
      if (groupFullySelected) {
        return currentRows.filter((id) => !messageIds.includes(id));
      }

      return [...new Set([...currentRows, ...messageIds])];
    });
  }

  function toggleGroupExpanded(key: string) {
    setExpandedGroups((currentKeys) => {
      const nextKeys = new Set(currentKeys);

      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }

      return nextKeys;
    });
  }

  function handleTabChange(tab: DraftTab) {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedRows([]);
    setEditingDraftId(null);
    setDraftEditValue("");
    setExpandedGroups(new Set());
  }

  function handleStartEdit(row: DraftRow) {
    setEditingDraftId(row.id);
    setDraftEditValue(row.draft);
    setFeedback(null);
  }

  function handleCancelEdit() {
    setEditingDraftId(null);
    setDraftEditValue("");
  }

  async function handleEditSave(draftId: string) {
    if (processingId === draftId) {
      return;
    }

    const trimmedDraft = draftEditValue.trim();

    if (!trimmedDraft) {
      setFeedback({ type: "error", message: "Draft reply cannot be empty." });
      return;
    }

    setProcessingId(draftId);
    setProcessingAction("edit");
    setSavingEditId(draftId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/socials/instagram/edit/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: trimmedDraft }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        draft?: { id: string; draft: string };
      };

      if (!response.ok) {
        setFeedback({ type: "error", message: data.error || "Unable to update the Instagram draft." });
        return;
      }

      setDraftRows((currentRows) =>
        currentRows.map((row) => (row.id === draftId ? { ...row, draft: data.draft?.draft || trimmedDraft } : row)),
      );
      setEditingDraftId(null);
      setDraftEditValue("");
      setFeedback({ type: "success", message: data.message || "Instagram draft updated successfully." });
    } catch (error) {
      console.error("Unable to update Instagram draft:", error);
      setFeedback({ type: "error", message: "Unable to connect to the server." });
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
      setSavingEditId(null);
    }
  }

  async function handleApprove(draftId: string) {
    if (processingId === draftId) {
      return;
    }

    setProcessingId(draftId);
    setProcessingAction("approve");
    setFeedback(null);

    try {
      const response = await fetch(`/api/socials/instagram/approve/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        draft?: { id: string; status: string; sentAt: string | null };
      };

      if (!response.ok) {
        setFeedback({ type: "error", message: data.error || "Unable to send the Instagram reply." });
        return;
      }

      setDraftRows((currentRows) =>
        currentRows.map((row) =>
          row.id === draftId
            ? { ...row, status: "sent", sentAt: data.draft?.sentAt || new Date().toISOString() }
            : row,
        ),
      );
      setSelectedRows((currentRows) => currentRows.filter((id) => id !== draftId));
      setEditingDraftId(null);
      setDraftEditValue("");
      setFeedback({ type: "success", message: data.message || "Instagram reply sent successfully." });
    } catch (error) {
      console.error("Unable to approve Instagram draft:", error);
      setFeedback({ type: "error", message: "Unable to connect to the server." });
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  async function handleReject(draftId: string) {
    if (processingId === draftId) {
      return;
    }

    setProcessingId(draftId);
    setProcessingAction("reject");
    setFeedback(null);

    try {
      const response = await fetch(`/api/socials/instagram/reject/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setFeedback({ type: "error", message: data.error || "Unable to reject the Instagram draft." });
        return;
      }

      // Remove the draft instantly from the UI
      setDraftRows((currentRows) =>
        currentRows.filter((row) => row.id !== draftId),
      );
      setSelectedRows((currentRows) => currentRows.filter((id) => id !== draftId));
      setFeedback({ type: "success", message: data.message || "Instagram draft rejected successfully." });
    } catch (error) {
      console.error("Unable to reject Instagram draft:", error);
      setFeedback({ type: "error", message: "Unable to connect to the server." });
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  }

  async function handleAcceptAll() {
    if (bulkAction || selectedRows.length === 0) {
      return;
    }

    const draftIds = [...selectedRows];
    setBulkAction("approve");
    setFeedback(null);

    try {
      const response = await fetch("/api/socials/instagram/approve-bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftIds }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        succeeded?: { id: string; sentAt: string | null }[];
        failed?: { id: string; error: string }[];
      };

      if (!response.ok) {
        setFeedback({ type: "error", message: data.error || "Unable to send the Instagram replies." });
        return;
      }

      const succeeded = data.succeeded || [];
      const sentAtById = new Map(succeeded.map((item) => [item.id, item.sentAt]));
      const succeededIds = new Set(sentAtById.keys());

      setDraftRows((currentRows) =>
        currentRows.map((row) =>
          succeededIds.has(row.id)
            ? { ...row, status: "sent", sentAt: sentAtById.get(row.id) || new Date().toISOString() }
            : row,
        ),
      );
      // Failed drafts stay selected so the user can see and retry them.
      setSelectedRows((currentRows) => currentRows.filter((id) => !succeededIds.has(id)));

      const failedCount = data.failed?.length || 0;
      setFeedback({
        type: failedCount > 0 ? "error" : "success",
        message: data.message || `${succeeded.length} of ${draftIds.length} Instagram replies sent.`,
      });
    } catch (error) {
      console.error("Unable to bulk approve Instagram drafts:", error);
      setFeedback({ type: "error", message: "Unable to connect to the server." });
    } finally {
      setBulkAction(null);
    }
  }

  async function handleRejectAll() {
    if (bulkAction || selectedRows.length === 0) {
      return;
    }

    const draftIds = [...selectedRows];
    setBulkAction("reject");
    setFeedback(null);

    try {
      const response = await fetch("/api/socials/instagram/reject-bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftIds }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        succeeded?: { id: string }[];
        failed?: { id: string; error: string }[];
      };

      if (!response.ok) {
        setFeedback({ type: "error", message: data.error || "Unable to reject the Instagram drafts." });
        return;
      }

      const succeededIds = new Set((data.succeeded || []).map((item) => item.id));

      setDraftRows((currentRows) => currentRows.filter((row) => !succeededIds.has(row.id)));
      // Failed drafts stay selected so the user can see and retry them.
      setSelectedRows((currentRows) => currentRows.filter((id) => !succeededIds.has(id)));

      const failedCount = data.failed?.length || 0;
      setFeedback({
        type: failedCount > 0 ? "error" : "success",
        message: data.message || `${succeededIds.size} of ${draftIds.length} Instagram drafts rejected.`,
      });
    } catch (error) {
      console.error("Unable to bulk reject Instagram drafts:", error);
      setFeedback({ type: "error", message: "Unable to connect to the server." });
    } finally {
      setBulkAction(null);
    }
  }

  function renderDraftCell(row: DraftRow) {
    return (
      <td className={`max-w-52 px-3 py-3 text-xs ${!isRepliedTab && row.tone === "bad" ? "italic text-red-500" : "text-slate-500"}`}>
        {isRepliedTab ? (
          <span className="block truncate">&quot;{row.draft}&quot;</span>
        ) : editingDraftId === row.id ? (
          <div className="space-y-2">
            <textarea
              value={draftEditValue}
              onChange={(event) => setDraftEditValue(event.target.value)}
              rows={3}
              className="w-full rounded-control border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <div className="flex flex-wrap gap-2">
              <PressableButton
                type="button"
                onClick={() => void handleEditSave(row.id)}
                disabled={processingId !== null || bulkAction !== null}
                className="rounded-control bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-50"
              >
                {savingEditId === row.id ? "Saving..." : "Save"}
              </PressableButton>
              <PressableButton
                type="button"
                onClick={handleCancelEdit}
                disabled={processingId !== null || bulkAction !== null}
                className="rounded-control border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-50"
              >
                Cancel
              </PressableButton>
            </div>
          </div>
        ) : (
          <PressableButton
            type="button"
            onClick={() => handleStartEdit(row)}
            className="w-full cursor-text text-left"
          >
            <span className="block truncate">&quot;{row.draft}&quot;</span>
            <span className="mt-1 block text-[11px] text-slate-400">Click to edit</span>
          </PressableButton>
        )}
      </td>
    );
  }

  function renderActionsCell(row: DraftRow) {
    return (
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-2">
          <PressableButton
            type="button"
            onClick={() => handleApprove(row.id)}
            disabled={processingId !== null || bulkAction !== null}
            aria-label={`Approve draft from ${row.username}`}
            title="Approve"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-wait disabled:opacity-50"
          >
            {processingId === row.id && processingAction === "approve" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
          </PressableButton>
          <PressableButton
            type="button"
            onClick={() => handleReject(row.id)}
            disabled={processingId !== null || bulkAction !== null}
            aria-label={`Reject draft from ${row.username}`}
            title="Reject"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-red-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-wait disabled:opacity-50"
          >
            {processingId === row.id && processingAction === "reject" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </PressableButton>
          <PressableButton
            type="button"
            onClick={() => handleStartEdit(row)}
            disabled={processingId !== null || bulkAction !== null}
            aria-label={`Edit draft from ${row.username}`}
            title="Edit"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-wait disabled:opacity-50"
          >
            {processingId === row.id && processingAction === "edit" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
          </PressableButton>
        </div>
      </td>
    );
  }

  function renderMessageSubRow(row: DraftRow, index: number) {
    return (
      <motion.tr
        key={row.id}
        layout
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6, transition: { duration: DURATION.fast } }}
        transition={SPRING.gentle}
        className="bg-slate-50/60 hover:bg-slate-50"
      >
        {!isRepliedTab ? (
          <td className="px-5 py-2.5">
            <input
              type="checkbox"
              checked={selectedRows.includes(row.id)}
              onChange={() => handleSelectRow(row.id)}
              className="cursor-pointer rounded border-slate-300"
              aria-label={`Select message ${index + 1} from ${row.username}`}
            />
          </td>
        ) : null}
        <td className="whitespace-nowrap px-3 py-2.5 pl-9 text-[11px] font-semibold text-slate-400">
          Message {index + 1}
        </td>
        <td className="px-3 py-2.5" />
        <td className="min-w-[22rem] whitespace-pre-wrap break-words px-3 py-2.5 align-top text-xs text-slate-500">
          &quot;{row.message}&quot;
        </td>
        {renderDraftCell(row)}
        {!isRepliedTab ? renderActionsCell(row) : null}
      </motion.tr>
    );
  }

  return (
    <section className="mt-5 overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">Draft Inbox</h2>
          {feedback ? (
            <p className={`mt-1 text-xs font-medium ${feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {feedback.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <div className="flex rounded-control bg-slate-50 p-1 text-xs font-semibold text-slate-500">
            {draftTabs.map((tab) => (
              <PressableButton
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`rounded-control px-3 py-1.5  cursor-pointer transition ${
                  activeTab === tab ? "bg-white text-primary shadow-card" : "hover:text-slate-900"
                }`}
              >
                {tab}
              </PressableButton>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
      {!isRepliedTab && allSelected ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: DURATION.fast } }}
          transition={SPRING.gentle}
          className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
              {selectedRows.length}
            </span>
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-semibold text-slate-800">
                {selectedRows.length} draft{selectedRows.length === 1 ? "" : "s"} selected
              </p>
              <span className="h-3.5 w-px bg-slate-300" aria-hidden="true" />
              <PressableButton
                type="button"
                onClick={() => setSelectedRows([])}
                className="cursor-pointer text-xs font-semibold text-primary transition hover:text-primary-hover hover:underline"
              >
                Clear selection
              </PressableButton>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PressableButton
              type="button"
              onClick={() => void handleAcceptAll()}
              disabled={bulkAction !== null || processingId !== null}
              className="inline-flex h-9 min-w-[116px] cursor-pointer items-center justify-center gap-1.5 rounded-control bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:cursor-wait disabled:opacity-50"
            >
              {bulkAction === "approve" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {bulkAction === "approve" ? "Sending..." : "Accept All"}
            </PressableButton>
            <PressableButton
              type="button"
              onClick={() => void handleRejectAll()}
              disabled={bulkAction !== null || processingId !== null}
              className="inline-flex h-9 min-w-[116px] cursor-pointer items-center justify-center gap-1.5 rounded-control bg-red-50 px-4 text-xs font-semibold text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 disabled:cursor-wait disabled:opacity-50"
            >
              {bulkAction === "reject" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {bulkAction === "reject" ? "Rejecting..." : "Reject All"}
            </PressableButton>
          </div>
        </motion.div>
      ) : null}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {!isRepliedTab ? (
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="cursor-pointer rounded border-slate-300"
                    aria-label="Select all drafts"
                  />
                </th>
              ) : null}
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Message Preview</th>
              <th className="px-3 py-3">{isRepliedTab ? "Replied" : "AI Draft Preview"}</th>
              {!isRepliedTab ? <th className="px-5 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={isRepliedTab ? 4 : 6} className="px-5 py-12 text-center">
                  <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-control bg-slate-100 text-slate-400">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {isRepliedTab ? "No replies sent in the last 24 hours" : "No unreplied drafts yet"}
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    {isRepliedTab
                      ? "Recently approved Instagram replies will appear here."
                      : "New Instagram DM and comment drafts will appear here."}
                  </p>
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {pageGroups.map((group) => {
                const hasMultipleMessages = group.messages.length > 1;
                const isExpanded = expandedGroups.has(group.key);
                const primaryRow = group.messages[0];

                return (
                  <Fragment key={group.key}>
                    <motion.tr
                      layout
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 32, transition: { duration: DURATION.base } }}
                      transition={SPRING.gentle}
                      className="hover:bg-slate-50/70">
                      {!isRepliedTab ? (
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={isGroupSelected(group)}
                            onChange={() => handleSelectGroup(group)}
                            className="cursor-pointer rounded border-slate-300"
                            aria-label={`Select all messages from ${group.username}`}
                          />
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="relative inline-flex shrink-0">
                            {group.profilePictureUrl ? (
                              // Instagram profile URLs are short-lived and use dynamic CDN hostnames.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={group.profilePictureUrl}
                                alt=""
                                className="h-12 w-12 rounded-full border border-white object-cover shadow-sm ring-1 ring-slate-200"
                              />
                            ) : (
                              <span className="h-15 w-15 rounded-full border border-white bg-linear-to-br from-indigo-100 via-sky-100 to-emerald-100 shadow-sm ring-1 ring-slate-200" />
                            )}
                            {hasMultipleMessages ? (
                              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-white">
                                {group.messages.length}
                              </span>
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-slate-700">{group.name}</span>
                            <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-400">{group.username}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{group.source}</span>
                      </td>
                      <td className="min-w-[22rem] whitespace-pre-wrap break-words px-3 py-3 align-top text-xs text-slate-500">
                        &quot;{primaryRow.message}&quot;
                        {hasMultipleMessages ? (
                          <span className="ml-1 text-[10px] font-semibold text-slate-400">
                            +{group.messages.length - 1} more
                          </span>
                        ) : null}
                      </td>
                      {hasMultipleMessages ? (
                        <td className="max-w-52 px-3 py-3 text-xs text-slate-500">
                          <PressableButton
                            type="button"
                            onClick={() => toggleGroupExpanded(group.key)}
                            className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                          >
                            <span>
                              <span className="block truncate font-semibold text-slate-600">
                                {group.messages.length} message{group.messages.length === 1 ? "" : "s"} to review
                              </span>
                              <span className="mt-1 block text-[11px] text-slate-400">
                                {isExpanded ? "Click to collapse" : "Click to expand"}
                              </span>
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </PressableButton>
                        </td>
                      ) : (
                        renderDraftCell(primaryRow)
                      )}
                      {!isRepliedTab ? (
                        hasMultipleMessages ? (
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end">
                              <PressableButton
                                type="button"
                                onClick={() => toggleGroupExpanded(group.key)}
                                aria-label={isExpanded ? "Collapse messages" : "Expand messages"}
                                title={isExpanded ? "Collapse" : "Expand"}
                                className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                              >
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </PressableButton>
                            </div>
                          </td>
                        ) : (
                          renderActionsCell(primaryRow)
                        )
                      ) : null}
                    </motion.tr>
                    <AnimatePresence initial={false}>
                      {hasMultipleMessages && isExpanded
                        ? group.messages.map((message, index) => renderMessageSubRow(message, index))
                        : null}
                    </AnimatePresence>
                  </Fragment>
                );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Showing {showingStart}-{showingEnd} of {filteredGroups.length}</p>
        <div className="flex items-center gap-3">
          <PressableButton
            type="button"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="inline-flex h-10 items-center rounded-control border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-card transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none disabled:hover:border-slate-200"
          >
            Previous
          </PressableButton>
          <span className="inline-flex h-10 items-center rounded-control bg-slate-50 px-4 text-sm font-bold text-slate-700">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <PressableButton
            type="button"
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className="inline-flex h-10 items-center rounded-control border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-card transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none disabled:hover:border-slate-200"
          >
            Next
          </PressableButton>
        </div>
      </div>
    </section>
  );
}
