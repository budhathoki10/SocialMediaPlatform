import {
  BarChart3,
  Bell,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CircleHelp,
  CirclePlus,
  Clock3,
  FileText,
  Grid2X2,
  LayoutDashboard,
  List,
  LogOut,
  MessageSquare,
  Newspaper,
  Search,
  Settings,
  SquareTerminal,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ScheduledPostFilters } from "@/components/dashboard/ScheduledPostFilters";
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

type ScheduledPost = {
  _id: string;
  content: string;
  pr_title?: string | null;
  media_url?: string | null;
  status: "draft" | "scheduled" | "published" | "failed" | "cancelled";
  scheduled_time?: Date | null;
  created_at: Date;
  source: string;
};

type PostPlatformSummary = {
  post_id: string;
  platform: string;
  status: "pending" | "published" | "failed";
};

const sidebarItems = [
  { label: "Dashboard", Icon: LayoutDashboard, href: "/dashboard" },
  { label: "Create Post", Icon: CirclePlus, href: "#" },
  { label: "Scheduled Posts", Icon: CalendarDays, href: "/dashboard/scheduled-posts", active: true },
  { label: "Auto Reply", Icon: MessageSquare, href: "#" },
  { label: "News Feed", Icon: Newspaper, href: "/dashboard/tech-news" },
  { label: "GitHub Automation", Icon: SquareTerminal, href: "/dashboard/github" },
  { label: "Analytics", Icon: BarChart3, href: "#" },
  { label: "Settings", Icon: Settings, href: "#" },
];

const platformImages: Record<string, string> = {
  github: "/landing/githubs.png",
  linkedin: "/landing/linkedin.png",
  instagram: "/landing/instagram.png",
  facebook: "/landing/facebook.png",
  gmail: "/landing/gmail.png",
};

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  github: "GitHub",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter (X)",
  x: "Twitter (X)",
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

function formatDateParts(value?: Date | null) {
  if (!value) return { date: "No schedule", time: "Not set" };

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return { date: "No schedule", time: "Not set" };

  return {
    date: new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
    time: new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date),
  };
}

function statusClasses(status: ScheduledPost["status"]) {
  const styles = {
    cancelled: "bg-amber-50 text-amber-700",
    draft: "bg-slate-100 text-slate-600",
    failed: "bg-red-50 text-red-700",
    published: "bg-emerald-50 text-emerald-700",
    scheduled: "bg-blue-50 text-blue-700",
  };

  return styles[status] || styles.draft;
}

function StatusIcon({ status }: { status: ScheduledPost["status"] }) {
  if (status === "published") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "scheduled") return <Clock3 className="h-3.5 w-3.5" />;
  if (status === "draft") return <FileText className="h-3.5 w-3.5" />;

  return null;
}

function getPlatformForPost(post: ScheduledPost, platformMap: Map<string, string>) {
  return platformMap.get(post._id.toString()) || "linkedin";
}

function Sidebar() {
  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-5 py-6 lg:flex">
      <div>
        <Image
          src="/landing/autopilot-logo.png"
          alt="AutoPilot"
          width={250}
          height={60}
          className="h-auto w-[112px]"
          priority
        />
        <p className="mt-2 pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Automation Suite</p>
      </div>

      <nav className="mt-8 space-y-1.5">
        {sidebarItems.map(({ label, Icon, active, href }) => (
          <Link
            key={label}
            href={href}
            className={`flex h-10 items-center gap-3 rounded-md px-3.5 text-sm font-semibold transition ${
              active ? "bg-[#eef2ff] text-[#4338ca]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="rounded-lg border border-indigo-100 bg-[#f4f6ff] px-4 py-5">
          <p className="text-sm font-bold text-[#4338ca]">Upgrade to Pro</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">Unlock advanced automation tools and analytics.</p>
          <button className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#4338ca] text-sm font-bold text-white transition hover:bg-[#3730a3]">
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <a href="#" className="flex h-9 items-center gap-3 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <CircleHelp className="h-4 w-4" />
            Help Center
          </a>
          <Link href="/logoutPage" className="flex h-9 items-center gap-3 rounded-lg px-4 text-sm font-medium text-red-500 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
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

function PlatformBadge({ platform }: { platform: string }) {
  const imageSource = platformImages[platform];

  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100">
        {imageSource ? (
          <Image src={imageSource} alt="" width={18} height={18} className="h-4.5 w-4.5 object-contain" />
        ) : (
          <span className="text-[10px] font-black uppercase text-slate-500">{platform.slice(0, 2)}</span>
        )}
      </span>
      {platformLabels[platform] || platform}
    </span>
  );
}

function ContentPreview({ post }: { post: ScheduledPost }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {post.media_url ? (
          <Image src={post.media_url} alt="" fill sizes="48px" className="object-cover" unoptimized />
        ) : (
          <span className="grid h-full w-full place-items-center text-slate-500">
            {post.source === "tech_news" ? <Newspaper className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{post.pr_title || "Generated post"}</p>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{post.content}</p>
      </div>
    </div>
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
        <Sidebar />

        <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5">
            <form action="/dashboard/scheduled-posts" className="relative hidden min-w-0 flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={search}
                placeholder="Search scheduled content..."
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="platform" value={platform} />
            </form>

            <div className="ml-auto flex items-center gap-2">
              <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
              </button>
              <button aria-label="Settings" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                <Settings className="h-4 w-4" />
              </button>
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

                <div className="flex rounded-lg bg-slate-100 p-1">
                  <button className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-bold text-slate-500">
                    <CalendarRange className="h-4 w-4" />
                    Calendar
                  </button>
                  <button className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-[#4338ca] shadow-sm">
                    <List className="h-4 w-4" />
                    List View
                  </button>
                </div>
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
                    <Link href="/dashboard/scheduled-posts" className="text-xs font-bold text-[#4338ca] hover:text-[#3730a3]">
                      Clear filters
                    </Link>
                  )}
                </div>
              </div>

              <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px_126px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 md:grid">
                  <span>Content Preview</span>
                  <span>Platform</span>
                  <span>Scheduled Date</span>
                  <span>Status</span>
                </div>

                {visibleRows.length === 0 ? (
                  <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
                    <div>
                      <Grid2X2 className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-sm font-bold text-slate-800">No posts found</p>
                      <p className="mt-1 text-xs text-slate-500">Scheduled, draft, and published posts will appear here.</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {visibleRows.map(({ post, platform: rowPlatform }) => {
                      const scheduled = formatDateParts(post.scheduled_time || post.created_at);

                      return (
                        <article
                          key={post._id.toString()}
                          className="grid gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-blue-50 md:grid-cols-[minmax(0,1fr)_150px_150px_126px] md:items-center"
                        >
                          <ContentPreview post={post} />
                          <div>
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 md:hidden">Platform</p>
                            <PlatformBadge platform={rowPlatform} />
                          </div>
                          <div>
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 md:hidden">Scheduled Date</p>
                            <div className="inline-flex items-start gap-2 text-sm font-semibold text-slate-700">
                              <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
                              <span>
                                <span className="block">{scheduled.date}</span>
                                <span className="mt-0.5 block text-xs font-medium text-slate-500">{scheduled.time}</span>
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 md:hidden">Status</p>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClasses(post.status)}`}>
                              <StatusIcon status={post.status} />
                              {post.status === "published" ? "Published" : post.status}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
                  <p className="text-xs font-medium text-slate-500">
                    Showing {visibleRows.length === 0 ? 0 : pageStart + 1} to {Math.min(pageStart + PAGE_SIZE, rows.length)} of {rows.length} posts
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={previousHref}
                      aria-disabled={safePage === 1}
                      className={`inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold ${
                        safePage === 1 ? "pointer-events-none text-slate-300" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Previous
                    </Link>
                    <span className="rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-500">
                      Page {safePage} of {totalPages}
                    </span>
                    <Link
                      href={nextHref}
                      aria-disabled={safePage === totalPages}
                      className={`inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold ${
                        safePage === totalPages ? "pointer-events-none text-slate-300" : "text-[#4338ca] hover:bg-slate-50"
                      }`}
                    >
                      Next
                    </Link>
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
