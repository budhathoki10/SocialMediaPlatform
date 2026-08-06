// Builds a Freemius checkout URL for the logged-in user and redirects to it.
// The buyer's email is forced to match the session so the webhook payload's
// `email` field can be matched back to our own `User` collection later
// (Phase 3) — Freemius doesn't offer a way to echo an arbitrary internal id
// through checkout, so email is the reliable join key instead.
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { BillingPlan } from "@/lib/models";

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

  await connectDB();

  const billingPlan = await BillingPlan.findOne({ plan, is_active: true }).lean();

  if (!billingPlan?.provider_plan_id || !billingPlan?.provider_product_id) {
    console.error(
      `Cannot build Freemius checkout for plan "${plan}" — billing_plans is missing provider IDs. Run npm run seed:billing-plans.`,
    );
    return NextResponse.redirect(appUrl("/billing?error=checkout_unavailable"));
  }

  const checkoutUrl = new URL(
    `https://checkout.freemius.com/product/${billingPlan.provider_product_id}/plan/${billingPlan.provider_plan_id}/`,
  );

  checkoutUrl.searchParams.set("billing_cycle", period === "yearly" ? "annual" : "monthly");
  checkoutUrl.searchParams.set("email", session.user.email);

  const [firstName, ...lastNameParts] = (session.user.name || "").trim().split(" ");
  if (firstName) checkoutUrl.searchParams.set("first", firstName);
  if (lastNameParts.length) checkoutUrl.searchParams.set("last", lastNameParts.join(" "));

  if (process.env.FREEMIUS_SANDBOX === "true") {
    checkoutUrl.searchParams.set("sandbox", "true");
  }

  return NextResponse.redirect(checkoutUrl.toString());
}
