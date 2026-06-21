import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, User } from "@/lib/models";

function appUrl(path) {
  return `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${path}`;
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id && !session?.user?.email) {
    return null;
  }

  await connectDB();

  if (session.user.id) {
    const user = await User.findById(session.user.id);

    if (user) {
      return user;
    }
  }

  if (session.user.email) {
    return User.findOne({ email: session.user.email });
  }

  return null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(appUrl("/onboarding?error=linkedin_denied"));
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.redirect(appUrl("/login?callbackUrl=/onboarding"));
  }

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error("LinkedIn token exchange failed.", tokenData.error || "Unknown error");
    return NextResponse.redirect(appUrl("/onboarding?error=linkedin_token_failed"));
  }

  const linkedinUserRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    cache: "no-store",
  });
  const linkedinUser = await linkedinUserRes.json();

  if (!linkedinUserRes.ok || !linkedinUser?.sub) {
    console.error("LinkedIn profile lookup failed.", linkedinUser?.error || "Unknown error");
    return NextResponse.redirect(appUrl("/onboarding?error=linkedin_user_failed"));
  }

  await ConnectedAccount.findOneAndUpdate(
    { user_id: currentUser._id, platform: "linkedin" },
    {
      $set: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        platform_username: linkedinUser.name || linkedinUser.email || linkedinUser.sub,
        connected_at: new Date(),
        status: "active",
      },
    },
    { new: true, upsert: true, runValidators: true },
  );

  return NextResponse.redirect(appUrl("/onboarding?linkedin=connected"));
}