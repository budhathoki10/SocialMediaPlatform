// Thin route — resolves the logged-in user + their plan choice, then
// delegates the actual checkout-link construction to lib/billing (Freemius
// specifics live there, not here).
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { billing } from "@/lib/billing";
import { connectDB } from "@/lib/db";
import { activeSubscriptionFilter } from "@/lib/entitlements";
import { isFreemiusConfigured } from "@/lib/freemius";
import { BillingPlan, Subscription, User } from "@/lib/models";

export const dynamic = "force-dynamic";

const VALID_PLANS = new Set(["pro", "unlimited"]);

function appUrl(path) {
  return `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${path}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get("plan");
  const period = searchParams.get("period") === "yearly" ? "yearly" : "monthly";

  if (!VALID_PLANS.has(plan)) {
    return NextResponse.redirect(appUrl("/billing"));
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    const callbackUrl = `/api/billing/checkout?plan=${plan}&period=${period}`;
    return NextResponse.redirect(appUrl(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`));
  }

  if (!isFreemiusConfigured()) {
    console.error("Cannot build Freemius checkout — FREEMIUS_PRODUCT_ID/API_KEY/SECRET_KEY/PUBLIC_KEY are not set.");
    return NextResponse.redirect(appUrl("/billing?error=checkout_unavailable"));
  }

  await connectDB();

  const billingPlan = await BillingPlan.findOne({ plan, is_active: true }).lean();

  if (!billingPlan?.provider_plan_id) {
    console.error(
      `Cannot build Freemius checkout for plan "${plan}" — billing_plans is missing provider_plan_id. Run npm run seed:billing-plans.`,
    );
    return NextResponse.redirect(appUrl("/billing?error=checkout_unavailable"));
  }

  const user = await User.findOne({ email: session.user.email }).select("_id").lean();

  // If the user already has an active license for *any* plan/period, pass
  // its licenseId through so the checkout is authorized as an upgrade
  // against that existing license instead of starting an unrelated second
  // subscription.
  const existingSubscription = user
    ? await Subscription.findOne(activeSubscriptionFilter(user._id)).sort({ created_at: -1 }).select("fs_license_id").lean()
    : null;

  const checkoutUrl = await billing.buildCheckoutUrl({
    email: session.user.email,
    name: session.user.name,
    providerPlanId: billingPlan.provider_plan_id,
    period,
    existingLicenseId: existingSubscription?.fs_license_id || null,
  });

  return NextResponse.redirect(checkoutUrl);
}
