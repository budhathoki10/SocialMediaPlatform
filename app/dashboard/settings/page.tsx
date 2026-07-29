import { Settings as SettingsIcon } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GET as getSettingsRoute } from "@/app/api/settings/route";
import NotificationsButton from "@/components/dashboard/NotificationsButton";
import SettingsPanel, { type SettingsData } from "@/components/dashboard/SettingsPanel";

type SessionUser = {
  image?: string | null;
  name?: string | null;
};

async function getSettingsFromRoute(): Promise<SettingsData | null> {
  try {
    const response = await getSettingsRoute();

    if (!response.ok) return null;

    return (await response.json()) as SettingsData;
  } catch {
    return null;
  }
}

function Toolbar({ user }: { user?: SessionUser }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-6 lg:px-8">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <p className="mt-0.5 truncate text-sm font-bold text-slate-800">Account Settings</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationsButton />
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="hidden text-right sm:block">
          <p className="max-w-40 truncate text-sm font-bold leading-4 text-slate-700">{user?.name || "User"}</p>
          <p className="mt-1 text-xs text-slate-500">Free Member</p>
        </div>
        <Image
          src={user?.image || "/landing/testimonial-avatar.png"}
          alt={user?.name ? `${user.name} avatar` : "User avatar"}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
        />
      </div>
    </header>
  );
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/settings");
  }

  const settings = await getSettingsFromRoute();

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <Toolbar user={session.user} />

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
