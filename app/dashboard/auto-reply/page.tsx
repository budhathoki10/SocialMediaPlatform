import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GET as getAutoReplyLogsRoute } from "@/app/api/auto-reply/logs/route";
import { GET as getAutoReplyRulesRoute } from "@/app/api/auto-reply/rules/route";
import { GET as getAutoReplySettingsRoute } from "@/app/api/auto-reply/settings/route";
import { GET as getInstagramRoute } from "@/app/api/socials/instagram/route";
import { connectDB } from "@/lib/db";
import { getPlanForSessionUser, planAllowsAutoReply } from "@/lib/entitlements";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import PlanLockedState from "@/components/dashboard/PlanLockedState";
import AutoReplySettingsPanel, {
  type AutoReplyKeywordRule,
  type AutoReplyLogRow,
  type AutoReplySettingsData,
} from "@/components/dashboard/AutoReplySettingsPanel";

async function getSettingsFromRoute(): Promise<AutoReplySettingsData | null> {
  try {
    const response = await getAutoReplySettingsRoute();

    if (!response.ok) return null;

    const data = (await response.json()) as { settings?: AutoReplySettingsData };
    return data.settings || null;
  } catch {
    return null;
  }
}

async function getLogsFromRoute(): Promise<AutoReplyLogRow[]> {
  try {
    const response = await getAutoReplyLogsRoute();

    if (!response.ok) return [];

    const data = (await response.json()) as { logs?: AutoReplyLogRow[] };
    return data.logs || [];
  } catch {
    return [];
  }
}

async function getRulesFromRoute(): Promise<AutoReplyKeywordRule[]> {
  try {
    const response = await getAutoReplyRulesRoute();

    if (!response.ok) return [];

    const data = (await response.json()) as { rules?: AutoReplyKeywordRule[] };
    return data.rules || [];
  } catch {
    return [];
  }
}

/** Platform access only lists platforms with a working auto-reply surface.
 * LinkedIn is intentionally excluded here. WhatsApp has no integration yet —
 * it's always listed so the toggle can be saved ahead of that work, but
 * nothing reads platform_permissions.whatsapp to gate real sending. */
async function getConnectedPlatforms(): Promise<string[]> {
  const instagramResponse = await getInstagramRoute().catch(() => null);
  const connected: string[] = ["whatsapp"];

  if (instagramResponse?.ok) {
    const data = (await instagramResponse.json().catch(() => ({}))) as { connected?: boolean };
    if (data.connected) connected.push("instagram");
  }

  return connected;
}

export default async function AutoReplyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/auto-reply");
  }

  await connectDB();
  const plan = await getPlanForSessionUser(session.user);
  const hasAccess = planAllowsAutoReply(plan);

  const [settings, logs, rules, connectedPlatforms] = await Promise.all([
    getSettingsFromRoute(),
    getLogsFromRoute(),
    getRulesFromRoute(),
    getConnectedPlatforms(),
  ]);

  const panel = (
    <div className="mx-auto max-w-7xl">
      <AutoReplySettingsPanel
        initialSettings={settings}
        initialLogs={logs}
        initialRules={rules}
        connectedPlatforms={connectedPlatforms}
      />
    </div>
  );

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="Auto-Reply" user={session.user} />

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
              icon={MessageCircle}
              title="AI Auto-Reply"
              description="Automatically draft and send replies to Instagram DMs, comments, and WhatsApp messages — with tone, filtering, and keyword rules you control."
              features={[
                "2,000 AI auto-replies / month on Pro, unlimited on Unlimited",
                "Contact filtering & keyword exclusions",
                "Custom tone, length, and emoji controls",
                "Comment keyword auto-replies",
              ]}
              requiredPlan="pro"
            />
          </div>
        </div>
      )}
    </section>
  );
}
