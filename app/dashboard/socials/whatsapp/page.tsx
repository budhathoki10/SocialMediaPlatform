import { MessageSquare, Reply, Send, Users } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { getPlanForSessionUser, planAllowsWhatsapp } from "@/lib/entitlements";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import PlanLockedState from "@/components/dashboard/PlanLockedState";
import WhatsAppDraftInboxPreview from "@/components/dashboard/WhatsAppDraftInboxPreview";

// WhatsApp has no OAuth connect flow or API integration yet (see README
// "Not Yet Implemented") — this page is a static preview of what the
// automation panel will look like once that's built, not a working inbox.
// It's still plan-gated below (WhatsApp is Pro+ per components/pricing/data.ts)
// so Free users see the same upgrade path they'll hit once it's real.
const statCards = [
  { label: "Total Messages", Icon: MessageSquare },
  { label: "Total Chats", Icon: Users },
  { label: "Auto-Replies Sent", Icon: Reply },
  { label: "Sent Today", Icon: Send },
];

export default async function WhatsAppSocialPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/socials/whatsapp");
  }

  await connectDB();
  const plan = await getPlanForSessionUser(session.user);
  const hasAccess = planAllowsWhatsapp(plan);

  const panel = (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">WhatsApp</h1>

      <section className="mt-5 rounded-card border border-slate-200 bg-white px-5 py-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-100">
              <Image src="/landing/whatsapps.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">WhatsApp Business</h2>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                  Coming Soon
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Auto-reply and inbox automation for WhatsApp Business isn&apos;t built yet — this is a preview of the panel it&apos;ll land in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(({ label, Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-card border border-slate-200 bg-white p-4 shadow-card">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-none text-slate-950">0</p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <WhatsAppDraftInboxPreview />
    </div>
  );

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="WhatsApp" user={session.user} />

      {hasAccess ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{panel}</div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden px-4 py-6 opacity-70 blur-[3px] sm:px-6 lg:px-8"
          >
            {panel}
          </div>
          <div className="absolute inset-0 bg-white/40" aria-hidden="true" />
          <div className="relative grid h-full place-items-center overflow-y-auto px-4 py-10 sm:px-6 lg:px-8">
            <PlanLockedState
              icon={MessageSquare}
              title="WhatsApp Integration"
              description="Connect a WhatsApp Business account and let AutoPilot draft and send replies there too — same auto-reply engine as Instagram."
              features={["WhatsApp Business messaging", "Same auto-reply rules & tone controls as Instagram", "Unified inbox across platforms"]}
              requiredPlan="pro"
            />
          </div>
        </div>
      )}
    </section>
  );
}
