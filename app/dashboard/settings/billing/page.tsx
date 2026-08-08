import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { getPlanAndPeriodForSessionUser } from "@/lib/entitlements";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import LinkPurchaseForm from "@/components/billing/LinkPurchaseForm";
import PricingCards from "@/components/pricing/PricingCards";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/settings/billing");
  }

  await connectDB();
  const { plan: currentPlan, billingPeriod: currentPeriod } = await getPlanAndPeriodForSessionUser(session.user);
  const hasPaidPlan = currentPlan !== "free";

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <DashboardToolbar title="Upgrade Plan" user={session.user} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-10 sm:px-6 lg:px-8">
        {hasPaidPlan && (
          <div className="mx-auto mb-10 flex max-w-6xl flex-col items-start justify-between gap-4 rounded-panel border border-slate-200 bg-white p-6 shadow-card sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-tint text-primary">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">Manage your subscription</p>
                <p className="text-sm text-slate-500">Update your payment method, view invoices, or cancel — handled securely by Freemius.</p>
              </div>
            </div>
            <a
              href="/api/billing/portal"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Manage Billing
            </a>
          </div>
        )}

        <PricingCards
          titleAs="h1"
          animated={false}
          currentPlan={currentPlan as "free" | "pro" | "unlimited"}
          currentPeriod={currentPeriod as "monthly" | "yearly" | null}
        />

        {!hasPaidPlan && <LinkPurchaseForm />}
      </div>
    </section>
  );
}
