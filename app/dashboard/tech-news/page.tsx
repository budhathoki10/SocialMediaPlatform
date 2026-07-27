import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import TechNewsFeed from "@/components/dashboard/TechNewsFeed";

export default async function TechNewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/tech-news");
  }

  return (
    <section className="h-screen min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <TechNewsFeed />
    </section>
  );
}
