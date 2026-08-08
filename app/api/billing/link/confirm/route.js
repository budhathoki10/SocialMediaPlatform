// Attaches a license found via /api/billing/link/search to the logged-in
// user's account. See linkPurchaseToUser in lib/billing/freemius.js — it
// refuses to reassign a license already linked to a different existing
// account, so this can't be used to steal someone else's subscription.
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
  const licenseId = typeof body.licenseId === "string" ? body.licenseId.trim() : "";

  if (!licenseId) {
    return NextResponse.json({ error: "Missing license." }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).select("_id").lean();

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 401 });
  }

  try {
    await billing.linkPurchaseToUser({ userId: user._id, licenseId });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not link this license." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
