import { CalendarRange, CheckCircle2, Clock3, FileText, List, Search, Settings } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import NotificationsButton from "@/components/dashboard/NotificationsButton";
import { ScheduledPostFilters } from "@/components/dashboard/ScheduledPostFilters";
import ScheduledPostsList, { type ScheduledPost } from "@/components/dashboard/ScheduledPostsList";
import PressableButton from "@/components/motion/PressableButton";
import PressableLink from "@/components/motion/PressableLink";
import { connectDB } from "@/lib/db";
import { Post, PostPlatform, User } from "@/lib/models";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

type DashboardUser = {
  _id?: string;
  name?: string | null;
  avatar_url?: string | null;
  plan?: string | null;
};

type PostPlatformSummary = {
  post_id: string;
  platform: string;
  status: "pending" | "published" | "failed";
};

const statusOptions = ["all", "scheduled", "published", "draft"];
const platformOptions = ["all", "linkedin", "facebook", "instagram"];
const PAGE_SIZE = 10;

const statusLabels: Record<string, string> = {
  all: "Status",
  draft: "Draft",
  published: "Published",
  scheduled: "Scheduled",
};

const filterPlatformLabels: Record<string, string> = {
  all: "Platform",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

function readParam(searchParams: SearchParams, key: string, fallback = "") {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

function buildPageHref({ page, search, status, platform }: { page: number; search: string; status: string; platform: string }) {
  const params = new URLSearchParams();

  if (search) params.set("q", search);
  if (status !== "all") params.set("status", status);
  if (platform !== "all") params.set("platform", platform);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/dashboard/scheduled-posts?${query}` : "/dashboard/scheduled-posts";
}

function getPlatformForPost(post: ScheduledPost, platformMap: Map<string, string>) {
  return platformMap.get(post._id.toString()) || "linkedin";
}

function UserAvatar({ user }: { user: DashboardUser }) {
  return (
    <Image
      src={user.avatar_url || "/landing/testimonial-avatar.png"}
      alt={user.name ? `${user.name} avatar` : "User avatar"}
      width={36}
      height={36}
      className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
    />
  );
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;

  if (!sessionUser?.id && !sessionUser?.email) return null;

  await connectDB();

  if (sessionUser.id) {
    const user = await User.findById(sessionUser.id)
      .select("_id name avatar_url plan")
      .lean<DashboardUser>();

    if (user) return user;
  }

  if (sessionUser.email) {
    return User.findOne({ email: sessionUser.email })
      .select("_id name avatar_url plan")
      .lean<DashboardUser>();
  }

  return null;
}

export default async function ScheduledPostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user?._id) {
    redirect("/login?callbackUrl=/dashboard/scheduled-posts");
  }

  const search = readParam(params, "q").trim();
  const status = readParam(params, "status", "all");
  const platform = readParam(params, "platform", "all");
  const requestedPage = Number(readParam(params, "page", "1"));
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const statusCounts = await Post.aggregate<{ _id: string; count: number }>([
    { $match: { user_id: user._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const countByStatus = new Map(statusCounts.map((entry) => [entry._id, entry.count]));
  const totalPostCount = statusCounts.reduce((sum, entry) => sum + entry.count, 0);

  const overviewStats = [
    { key: "all", label: "Total Queue", value: totalPostCount, icon: List },
    { key: "scheduled", label: "Scheduled", value: countByStatus.get("scheduled") || 0, icon: Clock3 },
    { key: "published", label: "Published", value: countByStatus.get("published") || 0, icon: CheckCircle2 },
    { key: "draft", label: "Drafts", value: countByStatus.get("draft") || 0, icon: FileText },
  ];

  const postQuery: Record<string, unknown> = { user_id: user._id };

  if (statusOptions.includes(status) && status !== "all") {
    postQuery.status = status;
  }

  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    postQuery.$or = [{ pr_title: pattern }, { content: pattern }, { source: pattern }];
  }

  const posts = await Post.find(postQuery)
    .select("content pr_title media_url status scheduled_time created_at source")
    .sort({ created_at: -1 })
    .limit(100)
    .lean<ScheduledPost[]>();

  const postIds = posts.map((post) => post._id);
  const postPlatforms = postIds.length
    ? await PostPlatform.find({ post_id: { $in: postIds } })
        .select("post_id platform status")
        .lean<PostPlatformSummary[]>()
    : [];
  const platformByPost = new Map<string, string>();

  for (const postPlatform of postPlatforms) {
    const postId = postPlatform.post_id.toString();
    if (!platformByPost.has(postId)) {
      platformByPost.set(postId, postPlatform.platform);
    }
  }

  const rows = posts
    .map((post) => ({
      post,
      platform: getPlatformForPost(post, platformByPost),
    }))
    .filter((row) => platform === "all" || row.platform === platform);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const visibleRows = rows.slice(pageStart, pageStart + PAGE_SIZE);
  const previousHref = buildPageHref({ page: Math.max(1, safePage - 1), search, status, platform });
  const nextHref = buildPageHref({ page: Math.min(totalPages, safePage + 1), search, status, platform });

  return (
    <main className="h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="flex h-screen">
        <DashboardSidebar />

        <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5">
            <form action="/dashboard/scheduled-posts" className="relative hidden min-w-0 flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={search}
                placeholder="Search scheduled content..."
                className="h-9 w-full rounded-control border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="platform" value={platform} />
            </form>

            <div className="ml-auto flex items-center gap-2">
              <NotificationsButton />
              <PressableButton aria-label="Settings" title="Settings — coming soon" className="grid h-9 w-9 place-items-center rounded-control text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                <Settings className="h-4 w-4" />
              </PressableButton>
              <div className="ml-2 hidden h-8 w-px bg-slate-200 sm:block" />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-4 text-slate-800">{user.name || "User"}</p>
                <p className="mt-1 text-xs capitalize text-slate-500">{user.plan || "free"} Member</p>
              </div>
              <UserAvatar user={user} />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Scheduled Posts</h1>
                  <p className="mt-1 text-sm text-slate-500">Manage and monitor your upcoming social automation queue.</p>
                </div>

                <div className="flex rounded-control bg-slate-100 p-1">
                  <PressableButton
                    disabled
                    title="Calendar view — coming soon"
                    className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-control px-3 text-sm font-bold text-slate-400"
                  >
                    <CalendarRange className="h-4 w-4" />
                    Calendar
                  </PressableButton>
                  <PressableButton className="inline-flex h-9 items-center gap-2 rounded-control bg-white px-3 text-sm font-bold text-primary shadow-sm">
                    <List className="h-4 w-4" />
                    List View
                  </PressableButton>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {overviewStats.map((stat) => {
                  const isActive = status === stat.key;
                  const Icon = stat.icon;

                  return (
                    <PressableLink
                      key={stat.key}
                      href={buildPageHref({ page: 1, search, status: stat.key, platform })}
                      className={`flex items-center gap-3 rounded-card border p-4 shadow-card transition-colors ${
                        isActive ? "border-primary bg-primary-tint" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-control ${
                          isActive ? "bg-white text-primary" : "bg-primary-tint text-primary"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-2xl font-extrabold leading-none text-slate-950">{stat.value}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{stat.label}</p>
                      </div>
                    </PressableLink>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <ScheduledPostFilters
                  currentPlatform={platform}
                  currentSearch={search}
                  currentStatus={status}
                  platformOptions={platformOptions.map((option) => ({
                    label: filterPlatformLabels[option] || option,
                    value: option,
                  }))}
                  statusOptions={statusOptions.map((option) => ({
                    label: statusLabels[option] || option,
                    value: option,
                  }))}
                />

                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {visibleRows.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, rows.length)} of {rows.length} posts
                  </p>
                  {(search || status !== "all" || platform !== "all") && (
                    <PressableLink href="/dashboard/scheduled-posts" className="text-xs font-bold text-primary hover:text-primary-hover">
                      Clear filters
                    </PressableLink>
                  )}
                </div>
              </div>

              <section className="mt-5">
                <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px_126px] gap-4 px-5 pb-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 md:grid">
                  <span>Content Preview</span>
                  <span>Platform</span>
                  <span>Scheduled Date</span>
                  <span>Status</span>
                </div>

                <ScheduledPostsList rows={visibleRows} />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-slate-200 bg-white px-5 py-4 shadow-card">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {visibleRows.length === 0 ? 0 : pageStart + 1} to {Math.min(pageStart + PAGE_SIZE, rows.length)} of {rows.length} posts
                  </p>
                  <div className="flex items-center gap-2">
                    <PressableLink
                      href={previousHref}
                      aria-disabled={safePage === 1}
                      className={`inline-flex h-8 items-center rounded-control border border-slate-200 bg-white px-3 text-xs font-bold ${
                        safePage === 1 ? "pointer-events-none text-slate-300" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Previous
                    </PressableLink>
                    <span className="rounded-control bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                      Page {safePage} of {totalPages}
                    </span>
                    <PressableLink
                      href={nextHref}
                      aria-disabled={safePage === totalPages}
                      className={`inline-flex h-8 items-center rounded-control border border-slate-200 bg-white px-3 text-xs font-bold ${
                        safePage === totalPages ? "pointer-events-none text-slate-300" : "text-primary hover:bg-primary-tint"
                      }`}
                    >
                      Next
                    </PressableLink>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
