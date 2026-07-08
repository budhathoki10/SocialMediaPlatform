import { CheckCircle2, ChevronLeft, ChevronRight, Eye, MessageSquare, MoreVertical, Pencil, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

const stats = [
  { label: "Total Drafts", value: "42", Icon: MessageSquare },
  { label: "Total DM Drafts", value: "28", Icon: MessageSquare },
  { label: "Total Comment Drafts", value: "14", Icon: MessageSquare },
  { label: "Sent Today", value: "156", Icon: Play, highlight: true },
];

const draftRows = [
  {
    status: "pending",
    user: "@alex_fitness",
    source: "DM",
    message: "How do I join the next challenge?",
    draft: "Hello Alex! We would love to help you join...",
    confidence: "94%",
    tone: "good",
  },
  {
    status: "live",
    user: "@marta_designs",
    source: "Comment",
    message: "Love the new collection!",
    draft: "Thank you Marta! We spent weeks refining...",
    confidence: "98%",
    tone: "good",
  },
  {
    status: "blocked",
    user: "@bot_zone_99",
    source: "DM",
    message: "FREE CRYPTO GIVEAWAY!!!",
    draft: "Draft suppressed - marketing spam detected.",
    confidence: "12%",
    tone: "bad",
  },
];

const activityRows = [
  { time: "10:42 AM", source: "DM", action: "Draft approved & sent", user: "@creative_mind", status: "sent" },
  { time: "10:39 AM", source: "Comment", action: "Spam filter triggered", user: "@bot_9182", status: "blocked" },
  { time: "10:35 AM", source: "DM", action: "AI draft generated", user: "@alex_fitness", status: "draft" },
];

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500",
  live: "bg-emerald-500",
  blocked: "bg-red-500",
};

const statusLegend = [
  { label: "Ready", color: "bg-emerald-500" },
  { label: "Needs review", color: "bg-amber-500" },
  { label: "Blocked", color: "bg-red-500" },
];

export default async function InstagramSocialPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/socials/instagram");
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="flex h-screen">
        <DashboardSidebar />

        <section className="h-screen min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Instagram</h1>

            <section className="mt-5 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                    <Image src="/landing/final-center-logo.png" alt="" width={56} height={56} className="h-10 w-10 rounded-xl object-cover" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Alex Creative Studio</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Instagram Connected
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">@alex_creativestudio</p>
                    <p className="mt-1 text-xs text-slate-500">Digital strategy & content automation.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-950">1,248</p>
                    <p className="text-xs text-slate-500">Posts</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-950">45.2k</p>
                    <p className="text-xs text-slate-500">Followers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-950">892</p>
                    <p className="text-xs text-slate-500">Following</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-4">
              {stats.map(({ label, value, Icon, highlight }) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <p className={`mt-3 text-2xl font-bold ${highlight ? "text-[#4338ca]" : "text-slate-950"}`}>{value}</p>
                </div>
              ))}
            </section>

            <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-bold text-slate-950">Draft Inbox</h2>
                <div className="flex flex-wrap items-center justify-end gap-4">
                  <div className="flex flex-wrap items-center gap-3 rounded-full bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
                    {statusLegend.map(({ label, color }) => (
                      <span key={label} className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        {label}
                      </span>
                    ))}
                  </div>
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
                        <input type="checkbox" className="rounded border-slate-300" aria-label="Select all drafts" />
                      </th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">User</th>
                      <th className="px-3 py-3">Source</th>
                      <th className="px-3 py-3">Message Preview</th>
                      <th className="px-3 py-3">AI Draft Preview</th>
                      <th className="px-3 py-3">Confidence</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftRows.map((row) => (
                      <tr key={row.user} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <input type="checkbox" className="rounded border-slate-300" aria-label={`Select ${row.user}`} />
                        </td>
                        <td className="px-3 py-3">
                          <span className={`block h-2 w-2 rounded-full ${statusStyles[row.status]}`} />
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
                          <div className="flex items-center justify-end gap-2 text-slate-400">
                            <Eye className="h-4 w-4" />
                            <Pencil className="h-4 w-4" />
                            <CheckCircle2 className="h-4 w-4" />
                            <Trash2 className="h-4 w-4" />
                            <MoreVertical className="h-4 w-4" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing <span className="font-semibold text-slate-700">1-25</span> of <span className="font-semibold text-slate-700">200</span> items
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    {["1", "2", "3", "...", "8"].map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`grid h-8 min-w-8 place-items-center rounded-md px-2 font-semibold ${
                          page === "1" ? "bg-[#4338ca] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 font-semibold text-slate-600 shadow-sm hover:border-[#4338ca] hover:text-[#4338ca]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-bold text-slate-950">Recent Activity Log</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-3 py-3">Source</th>
                      <th className="px-3 py-3">Action</th>
                      <th className="px-3 py-3">User Entity</th>
                      <th className="px-5 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activityRows.map((row) => (
                      <tr key={`${row.time}-${row.action}`}>
                        <td className="px-5 py-3">
                          <span
                            className={`block h-2.5 w-2.5 rounded-full ${
                              row.status === "sent" ? "bg-emerald-500" : row.status === "blocked" ? "bg-red-500" : "bg-amber-500"
                            }`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{row.source}</span>
                        </td>
                        <td className="px-3 py-3 text-xs font-semibold text-slate-600">{row.action}</td>
                        <td className="px-3 py-3 text-xs font-semibold text-slate-500">{row.user}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
