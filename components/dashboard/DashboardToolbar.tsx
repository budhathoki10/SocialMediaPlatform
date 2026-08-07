import Image from "next/image";
import type { ReactNode } from "react";

import NotificationsButton from "@/components/dashboard/NotificationsButton";
import SettingsMenu from "@/components/dashboard/SettingsMenu";

type ToolbarUser = {
  name?: string | null;
  image?: string | null;
};

/**
 * The one dashboard page header — every /dashboard/* route renders this so
 * the page title, notifications, settings, and the account avatar always
 * sit in the same place on desktop. `children` is an optional middle slot
 * (e.g. Scheduled Posts' search box).
 *
 * Everything here — title included — is lg-only. DashboardSidebar's mobile
 * top bar already carries the app brand plus notifications/avatar, so this
 * whole row has nothing to add below lg. The bar itself collapses away
 * entirely on mobile unless `children` is passed (real page content, not
 * just a label), so pages with nothing to show there don't leave an empty
 * white strip.
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
    <header
      className={`h-16 items-center gap-4 border-b border-slate-200 bg-white px-5 sm:px-6 lg:flex lg:px-8 ${children ? "flex" : "hidden"}`}
    >
      <p className="hidden min-w-0 shrink-0 truncate text-sm font-bold text-slate-800 lg:block">{title}</p>

      {children}

      <div className="ml-auto hidden shrink-0 items-center gap-2 sm:gap-3 lg:flex">
        <NotificationsButton buttonClassName="grid h-9 w-9 place-items-center rounded-control text-slate-500 transition hover:bg-slate-50 hover:text-slate-950" />
        <SettingsMenu />
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="hidden text-right sm:block">
          <p className="max-w-40 truncate text-sm font-bold leading-4 text-slate-700">{user?.name || "User"}</p>
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
