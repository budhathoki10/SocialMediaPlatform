import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GET as getLinkedinStatusRoute } from "@/app/api/auth/linkedin/status/route";
import { GET as getAutoReplyLogsRoute } from "@/app/api/auto-reply/logs/route";
import { GET as getAutoReplyRulesRoute } from "@/app/api/auto-reply/rules/route";
import { GET as getAutoReplySettingsRoute } from "@/app/api/auto-reply/settings/route";
import { GET as getInstagramRoute } from "@/app/api/socials/instagram/route";
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

/** LinkedIn and Instagram currently expose connection status endpoints.
 * WhatsApp remains visible as an implemented inbox surface. */
async function getConnectedPlatforms(): Promise<string[]> {
  const [instagramResponse, linkedinResponse] = await Promise.all([
    getInstagramRoute().catch(() => null),
    getLinkedinStatusRoute().catch(() => null),
  ]);
  const connected: string[] = [];

  if (instagramResponse?.ok) {
    const data = (await instagramResponse.json().catch(() => ({}))) as { connected?: boolean };
    if (data.connected) connected.push("instagram");
  }

  if (linkedinResponse?.ok) {
    const data = (await linkedinResponse.json().catch(() => ({}))) as { connected?: boolean };
    if (data.connected) connected.push("linkedin");
  }

  return connected;
}

export default async function AutoReplyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/auto-reply");
  }

  const [settings, logs, rules, connectedPlatforms] = await Promise.all([
    getSettingsFromRoute(),
    getLogsFromRoute(),
    getRulesFromRoute(),
    getConnectedPlatforms(),
  ]);

  return (
    <section className="h-screen min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AutoReplySettingsPanel
          initialSettings={settings}
          initialLogs={logs}
          initialRules={rules}
          connectedPlatforms={connectedPlatforms}
        />
      </div>
    </section>
  );
}
