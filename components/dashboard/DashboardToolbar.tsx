import { Settings } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import NotificationsButton from "@/components/dashboard/NotificationsButton";
import PressableLink from "@/components/motion/PressableLink";

type ToolbarUser = {
  name?: string | null;
  image?: string | null;
  plan?: string | null;
};

/**
 * The one dashboard page header — every /dashboard/* route renders this so
 * the page title, notifications, settings, and the account avatar always
 * sit in the same place. `children` is an optional middle slot (currently
 * unused now that Scheduled Posts' search box moved into page content, but
 * kept for whatever page-specific control needs it next).
 *
 * Notifications/settings/avatar are lg-only — DashboardSidebar already puts
 * that cluster in the mobile top bar next to the logo, so repeating it here
 * below lg would just duplicate the same controls one row down. The title
 * still shows on every size, though: the logo bar carries the app brand,
 * this carries which page you're on.
 */
export default function DashboardToolbar({
  title,
  user,
  children,
}: {
  title: string;
  user?: ToolbarUser;
  children?: ReactNode;
}) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-5 sm:px-6 lg:px-8">
      <p className="min-w-0 shrink-0 truncate text-sm font-bold text-slate-800">{title}</p>

      {children}

      <div className="ml-auto hidden shrink-0 items-center gap-2 sm:gap-3 lg:flex">
        <NotificationsButton buttonClassName="grid h-9 w-9 place-items-center rounded-control text-slate-500 transition hover:bg-slate-50 hover:text-slate-950" />
        <PressableLink
          href="/dashboard/settings"
          aria-label="Settings"
          className="hidden h-9 w-9 place-items-center rounded-control text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 sm:grid"
        >
          <Settings className="h-5 w-5" />
        </PressableLink>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="hidden text-right sm:block">
          <p className="max-w-40 truncate text-sm font-bold leading-4 text-slate-700">{user?.name || "User"}</p>
          <p className="mt-1 text-xs capitalize text-slate-500">{user?.plan || "free"} Member</p>
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
