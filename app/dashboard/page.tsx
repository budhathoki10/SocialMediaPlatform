import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  CirclePlus,
  Filter,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SquareTerminal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "../api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, GithubEvent, Post, User } from "@/lib/models";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import RecentPostsPanel from "@/components/dashboard/RecentPostsPanel";

// The dashboard contains live post and webhook data, so it must not reuse a
// previously rendered page payload on refresh.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardUser = {
  _id?: string;
  name?: string | null;
  avatar_url?: string | null;
  plan?: string | null;
  timezone?: string | null;
};

type ConnectedAccountSummary = {
  _id: string;
  platform: string;
  platform_username: string;
  status: "active" | "expired" | "revoked" | "error";
  connected_at: Date;
};

type GithubEventSummary = {
  _id: string;
  repo_name: string;
  event_type: string;
  created_at: Date;
};

const sidebarItems = [
  { label: "Dashboard", Icon: LayoutDashboard, active: true, href: "/dashboard" },
  { label: "Create Post", Icon: CirclePlus },
  { label: "Scheduled Posts", Icon: CalendarDays },
  { label: "Auto Reply", Icon: MessageSquare },
  { label: "Tech News", Icon: Newspaper },
  { label: "GitHub Automation", Icon: SquareTerminal, href: "/dashboard/github" },
  { label: "Analytics", Icon: BarChart3 },
  { label: "Settings", Icon: Settings },
];

const platformImages: Record<string, string> = {
  github: "/landing/githubs.png",
  linkedin: "/landing/linkedin.png",
  instagram: "/landing/instagram.png",
  facebook: "/landing/facebook.png",
  gmail: "/landing/gmail.png",
};

const platformNames: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  gmail: "Gmail",
  twitter: "Twitter",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
};

function getGreeting(timezone = "Asia/Kathmandu") {
  try {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: timezone,
      }).format(new Date()),
    );

    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  } catch {
    return "Welcome back";
  }
}

function formatAccountUsername(account: ConnectedAccountSummary) {
  const username = account.platform_username.trim();

  if (account.platform === "linkedin") {
    const storedIdentifier = username.match(/^[A-Za-z0-9_-]{8,}\s+(.+)$/);
    return storedIdentifier?.[1] || username;
  }

  return username;
}

function AccountLogo({ platform }: { platform: string }) {
  const imageSource = platformImages[platform];

  if (imageSource) {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white">
        <Image src={imageSource} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      </span>
    );
  }

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-900 text-[10px] font-black text-white">
      {platform.slice(0, 2).toUpperCase()}
    </span>
  );
}

const UserAvatar = ({ imageSrc, name }: { imageSrc?: string | null; name?: string | null }) => (
  <Image
    src={imageSrc || "/landing/testimonial-avatar.png"}
    alt={name ? `${name} avatar` : "User avatar"}
    width={40}
    height={40}
    className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
  />
);

const Sidebar = () => (
  <aside className="hidden min-h-screen w-[232px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
    <div>
      <Image
        src="/landing/autopilot-logo.png"
        alt="AutoPilot"
        width={250}
        height={150}
        className="h-auto w-[142px]"
        priority
      />
      <p className="mt-1 pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Automation Suite</p>
    </div>

    <nav className="mt-9 space-y-2">
      {sidebarItems.map(({ label, Icon, active, href }) => (
        <a
          key={label}
          href={href || "#"}
          className={`flex h-10 items-center gap-3 rounded-lg px-4 text-sm font-medium transition ${
            active ? "bg-indigo-50 text-[#4338ca]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </a>
      ))}
    </nav>

    <div className="mt-auto">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-5">
        <p className="text-sm font-bold text-[#4338ca]">Upgrade to Pro</p>
        <p className="mt-2 text-[11px] leading-5 text-slate-600">Unlock advanced automation tools and analytics.</p>
        <button className="mt-4 h-9 w-full rounded-md bg-[#4338ca] text-sm font-bold text-white transition hover:bg-[#3730a3]">
          Upgrade Now
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

const Toolbar = ({ user }: { user: DashboardUser }) => (
  <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-7">
    <label className="flex h-10 min-w-0 flex-1 max-w-[560px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 text-slate-400">
      <Search className="h-4 w-4 shrink-0" />
      <input
        type="search"
        placeholder="Search automation tasks..."
        className="h-full min-w-0 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
    </label>

    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
      <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      </button>
      <button aria-label="Settings" className="hidden h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 sm:grid">
        <Settings className="h-5 w-5" />
      </button>
      <div className="hidden h-8 w-px bg-slate-200 sm:block" />
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-36 truncate text-sm font-bold leading-4 text-slate-700">{user.name || "User"}</p>
          <p className="mt-1 text-xs capitalize text-slate-500">{user.plan || "free"} Member</p>
        </div>
        <UserAvatar imageSrc={user.avatar_url} name={user.name} />
      </div>
    </div>
  </header>
);

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-36 place-items-center px-5 text-center">
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function getRelativeTime(value: Date) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

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

export default async function DashboardPage() {
  await connectDB();
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;

  if (!sessionUser?.id && !sessionUser?.email) {
    redirect("/login");
  }

  const userQuery = sessionUser.id ? { _id: sessionUser.id } : { email: sessionUser.email };
  const user = await User.findOne(userQuery)
    .select("_id name avatar_url plan timezone")
    .lean<DashboardUser>();

  if (!user?._id) {
    redirect("/login");
  }

  const [accounts, activities, totalPostCount] = await Promise.all([
    ConnectedAccount.find({ user_id: user._id })
      .select("platform platform_username status connected_at")
      .sort({ connected_at: -1 })
      .lean<ConnectedAccountSummary[]>(),
    GithubEvent.find({ user_id: user._id })
      .select("repo_name event_type created_at")
      .sort({ created_at: -1 })
      .limit(5)
      .lean<GithubEventSummary[]>(),
    Post.countDocuments({ user_id: user._id, status: "published" }),
  ]);
  const activeAccounts = accounts.filter((account) => account.status === "active");
  const greeting = getGreeting(user.timezone || undefined);
  const firstName = user.name?.trim().split(" ")[0] || "there";
  const activityFeedItems =
    activities.length > 0
      ? activities.slice(0, 3).map((activity, index) => ({
          id: activity._id,
          title: index === 0 ? "AI Agent generated a draft post" : `${activity.event_type.replaceAll("_", " ")} received`,
          description:
            index === 0
              ? `New draft created from ${activity.repo_name}.`
              : `${activity.repo_name} was processed by AutoPilot automation.`,
          time: getRelativeTime(activity.created_at),
          type: index === 0 ? ("ai" as const) : ("success" as const),
        }))
      : [
          {
            id: "dummy-published",
            title: "Twitter post successfully published",
            description: "Post ID #TW-89210 was sent to @alexchen_tech",
            time: "2m ago",
            type: "success" as const,
          },
          {
            id: "dummy-ai",
            title: "AI Agent generated 5 draft posts",
            description: "New drafts are waiting in the Scheduled Posts queue.",
            time: "45m ago",
            type: "ai" as const,
          },
          {
            id: "dummy-token",
            title: "Instagram API Token Expiring",
            description: "Re-authentication required for @alex_creativestudio.",
            time: "2h ago",
            type: "warning" as const,
          },
        ];

  return (
    <main
      className="min-h-screen p-1 text-slate-950"
      style={{
        backgroundImage: "radial-gradient(#d9dde7 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      <div className="flex min-h-[calc(100vh-8px)] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <Sidebar />

        <section className="flex min-w-0 flex-1 flex-col">
          <Toolbar user={user} />

          <div className="flex-1 px-5 py-6 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">System Overview</h1>
                <p className="mt-1 text-sm text-slate-600">Monitor your social presence and automation health.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4338ca] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#3730a3]">
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
              </div>
            </div>

            <section className="relative mt-6 overflow-hidden rounded-lg bg-[#4338ca] px-6 py-6 text-white shadow-sm sm:px-7">
              <div className="absolute -right-7 -top-10 text-[150px] font-black leading-none text-white/10">↑</div>
              <div className="relative max-w-2xl">
                <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {activeAccounts.length > 0 ? "System status: connected" : "System status: ready"}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{greeting}, {firstName}.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
                  {activeAccounts.length > 0
                    ? `You have ${activeAccounts.length} active connected ${activeAccounts.length === 1 ? "account" : "accounts"} and ${totalPostCount} ${totalPostCount === 1 ? "post" : "posts"}.`
                    : "Connect a platform to start generating, scheduling, and tracking your social content."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <div className="min-w-28 rounded-md bg-white/15 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-100">Connected</p>
                    <p className="mt-1 text-lg font-bold">{activeAccounts.length}</p>
                  </div>
                  <div className="min-w-28 rounded-md bg-white/15 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-100">Posts</p>
                    <p className="mt-1 text-lg font-bold">{totalPostCount}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <RecentPostsPanel />

              <section className="min-h-[278px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-950">Connected Accounts</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{activeAccounts.length}</span>
                  </div>
                  <Link href="/onboarding" aria-label="Connect a platform" className="grid h-7 w-7 place-items-center rounded-md bg-indigo-50 text-[#4338ca] hover:bg-indigo-100">
                    <Plus className="h-4 w-4" />
                  </Link>
                </div>

                {activeAccounts.length === 0 ? (
                  <EmptyPanel title="No connected accounts" description="Only active connected platforms will appear here." />
                ) : (
                  <div className="space-y-3 p-4">
                    {activeAccounts.map((account) => (
                      <div key={account._id} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-3 transition hover:border-indigo-200 hover:bg-indigo-50/40">
                        <AccountLogo platform={account.platform} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-800">{platformNames[account.platform] || account.platform}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{formatAccountUsername(account)}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="min-h-[278px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-[#4338ca]" />
                    <h2 className="text-sm font-bold text-slate-950">Recent Tech News</h2>
                  </div>
                  <button type="button" aria-label="Refresh tech news" className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-[#4338ca]">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-5 px-5 py-5">
                  {techNews.map((news) => (
                    <article key={news.title} className="flex gap-3">
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-slate-900 text-[10px] font-black text-white">
                        AI
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#4338ca]">{news.category}</p>
                        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-800">{news.title}</h3>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{news.description}</p>
                        <button type="button" className="mt-2 h-7 rounded-md bg-[#4338ca] px-3 text-xs font-bold text-white transition hover:bg-[#3730a3]">
                          Post This
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <ActivityFeed initialItems={activityFeedItems} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
