import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { getPlanForSessionUser } from "@/lib/entitlements";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

// Shared shell for every /dashboard/* route. DashboardSidebar lives here,
// outside the loading.tsx Suspense boundary, so it renders once and stays
// mounted across navigations instead of unmounting/remounting (and visibly
// flickering) on every page change. DashboardSidebar owns the outer <main>
// (desktop persistent aside + mobile top bar/drawer) and renders {children}
// inside it — see that component for the responsive shell. The session is
// fetched here (not just per-page) so the mobile top bar can show the
// account avatar/notifications next to the logo on every route without each
// page having to thread that data through itself. Plan is fetched here for
// the same reason — it's shown once, as a small label under "Upgrade Plan"
// in the sidebar, not per-page anymore.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  await connectDB();
  const plan = await getPlanForSessionUser(session?.user);

  return (
    <DashboardSidebar user={session?.user} plan={plan}>
      {children}
    </DashboardSidebar>
  );
}
