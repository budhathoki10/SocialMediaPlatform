import { CheckCircle2, MessageSquare, Play } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GET as getInstagramDraftsRoute } from "@/app/api/socials/instagram/drafts/route";
import { GET as getInstagramRoute } from "@/app/api/socials/instagram/route";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import InstagramDraftInbox from "@/components/dashboard/InstagramDraftInbox";

type InstagramProfile = {
  connected?: boolean;
  username?: string | null;
  name?: string | null;
  biography?: string | null;
  totalpost?: number | null;
  followers?: number | null;
  following?: number | null;
  profilePictureUrl?: string | null;
};

type InstagramSession = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
} | null;

type InstagramDraftRow = {
  id: string;
  externalId: string;
  name: string;
  username: string;
  profilePictureUrl?: string | null;
  source: string;
  message: string;
  draft: string;
  confidence: number | null;
  tone: string;
  status: string;
  createdAt: string | null;
  sentAt: string | null;
};

type InstagramDraftStats = {
  totalDrafts: number;
  totalDmDrafts: number;
  totalCommentDrafts: number;
  sentToday: number;
};

const statCards = [
  { label: "Total Drafts", key: "totalDrafts", Icon: MessageSquare },
  { label: "Total DM Drafts", key: "totalDmDrafts", Icon: MessageSquare },
  { label: "Total Comment Drafts", key: "totalCommentDrafts", Icon: MessageSquare },
  { label: "Sent Today", key: "sentToday", Icon: Play },
];

function formatCount(value?: number | null) {
  const number = Number(value || 0);

  if (number >= 10_000) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
      notation: "compact",
    }).format(number);
  }

  return new Intl.NumberFormat("en-US").format(number);
}

const EMPTY_DRAFT_DATA = {
  drafts: [] as InstagramDraftRow[],
  stats: {
    totalDrafts: 0,
    totalDmDrafts: 0,
    totalCommentDrafts: 0,
    sentToday: 0,
  } as InstagramDraftStats,
};

async function getInstagramProfileFromRoute() {
  try {
    const response = await getInstagramRoute();

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { profile?: InstagramProfile | null };

    return data.profile || null;
  } catch {
    return null;
  }
}

async function getInstagramDraftsFromRoute() {
  try {
    const response = await getInstagramDraftsRoute();

    if (!response.ok) {
      return EMPTY_DRAFT_DATA;
    }

    const data = (await response.json()) as { drafts?: InstagramDraftRow[]; stats?: InstagramDraftStats };

    return {
      drafts: data.drafts || [],
      stats: data.stats || EMPTY_DRAFT_DATA.stats,
    };
  } catch {
    return EMPTY_DRAFT_DATA;
  }
}

export default async function InstagramSocialPage() {
  const session = (await getServerSession(authOptions)) as InstagramSession;

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/socials/instagram");
  }

  const [instagramProfile, draftData] = await Promise.all([
    getInstagramProfileFromRoute(),
    getInstagramDraftsFromRoute(),
  ]);
  const draftRows = draftData.drafts;
  const instagramUsername = instagramProfile?.username || null;
  const instagramDisplayName = instagramProfile?.name || instagramUsername || "Instagram account";
  const instagramBio = instagramProfile?.biography || "Connect Instagram to sync profile details.";
  const instagramImage = instagramProfile?.profilePictureUrl || null;
  const isInstagramConnected = Boolean(instagramProfile?.connected);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="Instagram" user={session?.user} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Instagram</h1>

            <section className="mt-5 rounded-card border border-slate-200 bg-white px-5 py-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                    {instagramImage ? (
                      <img
                        src={instagramImage}
                        alt={`${instagramDisplayName} profile`}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <Image src="/landing/final-center-logo.png" alt="" width={56} height={56} className="h-10 w-10 rounded-control object-cover" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{instagramDisplayName}</h2>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isInstagramConnected ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {isInstagramConnected ? "Instagram Connected" : "Instagram Not Connected"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {instagramUsername ? `@${instagramUsername.replace(/^@/, "")}` : "Connect an Instagram profile"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{instagramBio}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-950">{formatCount(instagramProfile?.totalpost)}</p>
                    <p className="text-xs text-slate-500">Posts</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-950">{formatCount(instagramProfile?.followers)}</p>
                    <p className="text-xs text-slate-500">Followers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-950">{formatCount(instagramProfile?.following)}</p>
                    <p className="text-xs text-slate-500">Following</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {statCards.map(({ label, key, Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-card border border-slate-200 bg-white p-4 shadow-card">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl font-extrabold leading-none text-slate-950">
                      {formatCount(draftData.stats[key as keyof InstagramDraftStats])}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </section>

        <InstagramDraftInbox rows={draftRows} />
        </div>
      </div>
    </section>
  );
}
