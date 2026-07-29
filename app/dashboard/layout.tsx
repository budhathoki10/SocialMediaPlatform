import type { ReactNode } from "react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

// Shared shell for every /dashboard/* route. DashboardSidebar lives here,
// outside the loading.tsx Suspense boundary, so it renders once and stays
// mounted across navigations instead of unmounting/remounting (and visibly
// flickering) on every page change. DashboardSidebar owns the outer <main>
// (desktop persistent aside + mobile top bar/drawer) and renders {children}
// inside it — see that component for the responsive shell.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardSidebar>{children}</DashboardSidebar>;
}
