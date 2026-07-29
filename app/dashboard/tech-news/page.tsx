import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import TechNewsFeed from "@/components/dashboard/TechNewsFeed";

export default async function TechNewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/tech-news");
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="News Feed" user={session.user} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* News Feed was built for desktop use only. Below lg the title in
            the toolbar above is all that shows here — no feed, and no
            substitute message either, just nothing. */}
        <div className="hidden lg:block">
          <TechNewsFeed />
        </div>
      </div>
    </section>
  );
}
