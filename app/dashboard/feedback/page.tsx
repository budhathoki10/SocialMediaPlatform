import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import FeedbackForm from "@/components/dashboard/FeedbackForm";

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/feedback");
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="AutoPilot Feedback" user={session.user} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7 sm:px-6 lg:px-8">
        <FeedbackForm userName={session.user.name} userEmail={session.user.email} />
      </div>
    </section>
  );
}
