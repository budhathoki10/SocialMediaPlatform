import {
  CheckCircle2,
  Clock3,
  FileText,
  Link2,
  Plus,
  Send,
} from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "../api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ActivityLog, ConnectedAccount, Post, User } from "@/lib/models";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import EmptyState from "@/components/dashboard/EmptyState";
import RecentPostsPanel from "@/components/dashboard/RecentPostsPanel";
import RecentTechNewsPanel from "@/components/dashboard/RecentTechNewsPanel";
import CountUp from "@/components/motion/CountUp";
import HoverCard from "@/components/motion/HoverCard";
import PressableLink from "@/components/motion/PressableLink";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerReveal";

// The dashboard contains live post and webhook data, so it must not reuse a
// previously rendered page payload on refresh.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardUser = {
  _id?: string;
  name?: string | null;
  avatar_url?: string | null;
  timezone?: string | null;
};

type ConnectedAccountSummary = {
  _id: string;
  platform: string;
  platform_username?: string | null;
  status: "active" | "expired" | "revoked" | "error";
  connected_at: Date;
};

type ActivityLogType =
  | "draft_generated"
  | "post_published"
  | "post_scheduled"
  | "account_connected"
  | "account_disconnected";

type ActivityLogSummary = {
  _id: string;
  type: ActivityLogType;
  platform: string;
  title: string;
  description: string;
  created_at: Date;
};

type ActivityFeedUiType = "success" | "ai" | "warning" | "scheduled" | "connection" | "disconnection";

const ACTIVITY_TYPE_TO_UI: Record<ActivityLogType, ActivityFeedUiType> = {
  draft_generated: "ai",
  post_published: "success",
  post_scheduled: "scheduled",
  account_connected: "connection",
  account_disconnected: "disconnection",
};

const platformImages: Record<string, string> = {
  github: "/landing/github.svg",
  linkedin: "/landing/linkedin.png",
  instagram: "/landing/insta.png",
  whatsapp: "/landing/whatsapps.png",
};

const platformNames: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
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
  const username = account.platform_username?.trim() || platformNames[account.platform] || account.platform;

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
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control border border-slate-200 bg-white">
        <Image src={imageSource} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      </span>
    );
  }

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-slate-900 text-[10px] font-black text-white">
      {platform.slice(0, 2).toUpperCase()}
    </span>
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

export default async function DashboardPage() {
  await connectDB();
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;

  if (!sessionUser?.id && !sessionUser?.email) {
    redirect("/login");
  }

  const userQuery = sessionUser.id ? { _id: sessionUser.id } : { email: sessionUser.email };
  const user = await User.findOne(userQuery)
    .select("_id name avatar_url timezone")
    .lean<DashboardUser>();

  if (!user?._id) {
    redirect("/login");
  }

  const [accounts, activities, totalPostCount, scheduledPostCount, draftPostCount] = await Promise.all([
    ConnectedAccount.find({ user_id: user._id })
      .select("platform platform_username status connected_at")
      .sort({ connected_at: -1 })
      .lean<ConnectedAccountSummary[]>(),
    ActivityLog.find({ user_id: user._id })
      .select("type platform title description created_at")
      .sort({ created_at: -1 })
      .limit(5)
      .lean<ActivityLogSummary[]>(),
    Post.countDocuments({ user_id: user._id, status: "published" }),
    Post.countDocuments({ user_id: user._id, status: "scheduled" }),
    Post.countDocuments({ user_id: user._id, status: "draft" }),
  ]);
  const activeAccounts = accounts.filter((account) => account.status === "active");
  const greeting = getGreeting(user.timezone || undefined);
  const firstName = user.name?.trim().split(" ")[0] || "there";
  const activityFeedItems = activities.slice(0, 3).map((activity) => ({
    id: activity._id.toString(),
    title: activity.title,
    description: activity.description,
    time: getRelativeTime(activity.created_at),
    type: ACTIVITY_TYPE_TO_UI[activity.type] || "success",
  }));

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="AutoPilot Dashboard" user={{ name: user.name, image: user.avatar_url }} />

      <div className="min-h-0 flex-1 overflow-y-auto">
          <StaggerGroup className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-6 lg:px-8">
            <StaggerItem className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">System Overview</h1>
                <p className="mt-1 text-sm text-slate-500">Monitor connected platforms, generated drafts, and publishing activity.</p>
              </div>
              <div className="flex items-center gap-3">
                <PressableLink href="/dashboard/create-post" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover">
                  <Plus className="h-4 w-4" />
                  New Task
                </PressableLink>
              </div>
            </StaggerItem>

            <StaggerItem as="section" className="mt-6 rounded-card border border-slate-200 bg-white p-5 shadow-card lg:p-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {activeAccounts.length > 0 ? "System connected" : "Ready for setup"}
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{greeting}, {firstName}.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {activeAccounts.length > 0
                  ? `You have ${activeAccounts.length} active connected ${activeAccounts.length === 1 ? "account" : "accounts"} and ${totalPostCount} published ${totalPostCount === 1 ? "post" : "posts"}.`
                  : "Connect a platform to start generating, scheduling, and tracking your social content."}
              </p>
              {activeAccounts.length === 0 && (
                <PressableLink
                  href="/onboarding"
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-control bg-primary px-4 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover"
                >
                  <Link2 className="h-4 w-4" />
                  Connect a platform
                </PressableLink>
              )}
            </StaggerItem>

            <StaggerItem className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <PressableLink
                href="/onboarding"
                aria-label="Manage connected accounts"
                className="hover-card-shadow flex items-center gap-3 rounded-card border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
                  <Link2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <CountUp value={activeAccounts.length} className="block text-2xl font-extrabold leading-none text-slate-950" />
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">Connected</p>
                </div>
              </PressableLink>
              <PressableLink
                href="/dashboard/scheduled-posts?status=published"
                aria-label="View published posts"
                className="hover-card-shadow flex items-center gap-3 rounded-card border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
                  <Send className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <CountUp value={totalPostCount} className="block text-2xl font-extrabold leading-none text-slate-950" />
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">Published</p>
                </div>
              </PressableLink>
              <PressableLink
                href="/dashboard/scheduled-posts?status=scheduled"
                aria-label="View scheduled posts"
                className="hover-card-shadow flex items-center gap-3 rounded-card border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
                  <Clock3 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <CountUp value={scheduledPostCount} className="block text-2xl font-extrabold leading-none text-slate-950" />
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">Scheduled</p>
                </div>
              </PressableLink>
              <PressableLink
                href="/dashboard/scheduled-posts?status=draft"
                aria-label="View draft posts"
                className="hover-card-shadow flex items-center gap-3 rounded-card border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <CountUp value={draftPostCount} className="block text-2xl font-extrabold leading-none text-slate-950" />
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">Drafts</p>
                </div>
              </PressableLink>
            </StaggerItem>

            <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              {/* Each column stacks independently (space-y, not a shared grid
                  row-track) so a tall Upcoming Posts list never forces empty
                  space under the shorter Connected Accounts card next to it.
                  Below xl, both wrapper divs collapse via `contents` so all
                  four cards become flat siblings in the outer grid — that's
                  what lets `order-*` below re-prioritize them by how often
                  they're actually checked on mobile (connection health and
                  posts first, the tech-news feed last), while `xl:contents`
                  reversing to a real box at xl restores today's exact
                  desktop grouping and masonry behavior. */}
              <div className="contents xl:block xl:space-y-5">
                <StaggerItem className="order-2 xl:order-none">
                  <RecentPostsPanel hasConnectedAccounts={activeAccounts.length > 0} />
                </StaggerItem>

                <StaggerItem className="order-4 xl:order-none">
                  <RecentTechNewsPanel />
                </StaggerItem>
              </div>

              <div className="contents xl:block xl:space-y-5">
                <StaggerItem
                  as="section"
                  className="order-1 min-h-[278px] overflow-hidden rounded-card border border-slate-200 bg-white shadow-card xl:order-none"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-950">Connected Accounts</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{activeAccounts.length}</span>
                    </div>
                    <PressableLink href="/onboarding" aria-label="Connect a platform" className="grid h-7 w-7 place-items-center rounded-control bg-primary-tint text-primary transition hover:bg-primary hover:text-white">
                      <Plus className="h-4 w-4" />
                    </PressableLink>
                  </div>

                  {activeAccounts.length === 0 ? (
                    <EmptyState
                      icon={Link2}
                      title="No connected accounts"
                      description="Only active connected platforms will appear here."
                      className="min-h-36"
                    />
                  ) : (
                    <div className="space-y-3 p-4">
                      {activeAccounts.map((account) => (
                        <HoverCard
                          key={account._id.toString()}
                          liftPx={2}
                          className="flex min-w-0 items-center gap-3 rounded-control border border-slate-200 bg-slate-50/60 px-3.5 py-3 transition hover:bg-white"
                        >
                          <AccountLogo platform={account.platform} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">{platformNames[account.platform] || account.platform}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">{formatAccountUsername(account)}</p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Live
                          </span>
                        </HoverCard>
                      ))}
                    </div>
                  )}
                </StaggerItem>

                <StaggerItem className="order-3 xl:order-none">
                  <ActivityFeed initialItems={activityFeedItems} />
                </StaggerItem>
              </div>
            </div>
      </StaggerGroup>
      </div>
    </section>
  );
}
