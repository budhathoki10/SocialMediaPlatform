import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { getPlanForSessionUser } from "@/lib/entitlements";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import PricingCards from "@/components/pricing/PricingCards";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/settings/billing");
  }

  await connectDB();
  const currentPlan = await getPlanForSessionUser(session.user);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="Upgrade Plan" user={session.user} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-10 sm:px-6 lg:px-8">
        <PricingCards titleAs="h1" animated={false} currentPlan={currentPlan as "free" | "pro" | "unlimited"} />
      </div>
    </section>
  );
}
