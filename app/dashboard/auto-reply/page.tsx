import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GET as getAutoReplyLogsRoute } from "@/app/api/auto-reply/logs/route";
import { GET as getAutoReplySettingsRoute } from "@/app/api/auto-reply/settings/route";
import AutoReplySettingsPanel, {
  type AutoReplyLogRow,
  type AutoReplySettingsData,
} from "@/components/dashboard/AutoReplySettingsPanel";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

async function getSettingsFromRoute(): Promise<AutoReplySettingsData | null> {
  const response = await getAutoReplySettingsRoute();

  if (!response.ok) return null;

  const data = (await response.json()) as { settings?: AutoReplySettingsData };
  return data.settings || null;
}

async function getLogsFromRoute(): Promise<AutoReplyLogRow[]> {
  const response = await getAutoReplyLogsRoute();

  if (!response.ok) return [];

  const data = (await response.json()) as { logs?: AutoReplyLogRow[] };
  return data.logs || [];
}

export default async function AutoReplyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/auto-reply");
  }

  const [settings, logs] = await Promise.all([getSettingsFromRoute(), getLogsFromRoute()]);

  return (
    <main className="h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="flex h-screen">
        <DashboardSidebar />

        <section className="h-screen min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AutoReplySettingsPanel initialSettings={settings} initialLogs={logs} />
          </div>
        </section>
      </div>
    </main>
  );
}
