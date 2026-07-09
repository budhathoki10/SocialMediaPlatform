import { CheckCircle2, MessageSquare, Play } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GET as getInstagramRoute } from "@/app/api/socials/instagram/route";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
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
  };
} | null;

const stats = [
  { label: "Total Drafts", value: "42", Icon: MessageSquare },
  { label: "Total DM Drafts", value: "28", Icon: MessageSquare },
  { label: "Total Comment Drafts", value: "14", Icon: MessageSquare },
  { label: "Sent Today", value: "156", Icon: Play, highlight: true },
];

const draftRows = [
  {
    user: "@alex_fitness",
    source: "DM",
    message: "How do I join the next challenge?",
    draft: "Hello Alex! We would love to help you join...",
    confidence: "94%",
    tone: "good",
  },
  {
    user: "@marta_designs",
    source: "Comment",
    message: "Love the new collection!",
    draft: "Thank you Marta! We spent weeks refining...",
    confidence: "98%",
    tone: "good",
  },
  {
    user: "@bot_zone_99",
    source: "DM",
    message: "FREE CRYPTO GIVEAWAY!!!",
    draft: "Draft suppressed - marketing spam detected.",
    confidence: "12%",
    tone: "bad",
  },
  {
    user: "@nina_growth",
    source: "Comment",
    message: "Can I get the link to your pricing?",
    draft: "Absolutely Nina! Here is the pricing page...",
    confidence: "96%",
    tone: "good",
  },
  {
    user: "@creative_mind",
    source: "DM",
    message: "Do you work with small creator brands?",
    draft: "Yes, we help creator brands build a stronger...",
    confidence: "89%",
    tone: "good",
  },
  {
    user: "@spam_promo",
    source: "Comment",
    message: "Buy followers today, instant delivery!!!",
    draft: "Draft suppressed - suspicious promotion detected.",
    confidence: "18%",
    tone: "bad",
  },
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

async function getInstagramProfileFromRoute() {
  const response = await getInstagramRoute();

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { profile?: InstagramProfile | null };

  return data.profile || null;
}

export default async function InstagramSocialPage() {
  const session = (await getServerSession(authOptions)) as InstagramSession;

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/socials/instagram");
  }

  const instagramProfile = await getInstagramProfileFromRoute();
  const instagramUsername = instagramProfile?.username || null;
  const instagramDisplayName = instagramProfile?.name || instagramUsername || "Instagram account";
  const instagramBio = instagramProfile?.biography || "Connect Instagram to sync profile details.";
  const instagramImage = instagramProfile?.profilePictureUrl || null;
  const isInstagramConnected = Boolean(instagramProfile?.connected);

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
                    {instagramImage ? (
                      <img
                        src={instagramImage}
                        alt={`${instagramDisplayName} profile`}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <Image src="/landing/final-center-logo.png" alt="" width={56} height={56} className="h-10 w-10 rounded-xl object-cover" />
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

            <InstagramDraftInbox rows={draftRows} />

          </div>
        </section>
      </div>
    </main>
  );
}
