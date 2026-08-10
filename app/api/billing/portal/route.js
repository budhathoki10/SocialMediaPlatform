// Redirects the signed-in user to Freemius's hosted customer portal —
// manage payment method, view invoices, cancel. Minted on click since the
// link is short-lived; nothing about it is stored.
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { billing } from "@/lib/billing";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

export const dynamic = "force-dynamic";

function appUrl(path) {
  return `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${path}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.redirect(appUrl("/login?callbackUrl=/api/billing/portal"));
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).select("_id").lean();

  if (!user) {
    return NextResponse.redirect(appUrl("/dashboard/settings/billing"));
  }

  const portalUrl = await billing.buildPortalUrl({ userId: user._id, email: session.user.email });

  if (!portalUrl) {
    return NextResponse.redirect(appUrl("/dashboard/settings/billing?error=portal_unavailable"));
  }

  return NextResponse.redirect(portalUrl);
}
