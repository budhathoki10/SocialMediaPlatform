// Looks up active Freemius purchases under a self-reported email, for the
// logged-in user to confirm before linking — the fallback for a purchase
// whose email never matched their AutoPilot account (see
// findLinkableEmailMatches in lib/billing/freemius.js for why this is safe
// without an email-ownership verification step: it can only surface
// purchases, never attach one, and it excludes anything already linked to a
// different existing account).
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { billing } from "@/lib/billing";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Enter the email you paid with." }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).select("_id").lean();

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 401 });
  }

  const matches = await billing.findLinkableEmailMatches({ email, requestingUserId: user._id });

  return NextResponse.json({
    matches: matches.map((match) => ({
      licenseId: match.licenseId,
      plan: match.plan,
      billingPeriod: match.billingPeriod,
      currentPeriodEnd: match.currentPeriodEnd?.toISOString?.() || null,
    })),
  });
}
