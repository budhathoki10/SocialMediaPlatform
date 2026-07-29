import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

// Shared shell for every /dashboard/* route. DashboardSidebar lives here,
// outside the loading.tsx Suspense boundary, so it renders once and stays
// mounted across navigations instead of unmounting/remounting (and visibly
// flickering) on every page change. DashboardSidebar owns the outer <main>
// (desktop persistent aside + mobile top bar/drawer) and renders {children}
// inside it — see that component for the responsive shell. The session is
// fetched here (not just per-page) so the mobile top bar can show the
// account avatar/notifications next to the logo on every route without each
// page having to thread that data through itself.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return <DashboardSidebar user={session?.user}>{children}</DashboardSidebar>;
}
