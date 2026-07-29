import { Settings as SettingsIcon } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GET as getSettingsRoute } from "@/app/api/settings/route";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import SettingsPanel, { type SettingsData } from "@/components/dashboard/SettingsPanel";

async function getSettingsFromRoute(): Promise<SettingsData | null> {
  try {
    const response = await getSettingsRoute();

    if (!response.ok) return null;

    return (await response.json()) as SettingsData;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/settings");
  }

  const settings = await getSettingsFromRoute();

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="Account Settings" user={session.user} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-control bg-primary-tint text-primary">
              <SettingsIcon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">Settings</h1>
              <p className="text-sm text-slate-500">Manage your profile, timezone, and connected accounts.</p>
            </div>
          </div>

          <div className="mt-6">
            <SettingsPanel initialSettings={settings} />
          </div>
        </div>
      </div>
    </section>
  );
}
