import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CreatePostComposer from "@/components/dashboard/CreatePostComposer";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";

export default async function CreatePostPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/create-post");
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="AutoPilot Composer" user={session.user} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7 sm:px-6 lg:px-8">
        <CreatePostComposer userName={session.user.name} />
      </div>
    </section>
  );
}
