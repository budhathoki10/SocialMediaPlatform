import type { ReactNode } from "react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

// Shared shell for every /dashboard/* route. DashboardSidebar lives here,
// outside the loading.tsx Suspense boundary, so it renders once and stays
// mounted across navigations instead of unmounting/remounting (and visibly
// flickering) on every page change.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="flex h-screen">
        <DashboardSidebar />
        {children}
      </div>
    </main>
  );
}
