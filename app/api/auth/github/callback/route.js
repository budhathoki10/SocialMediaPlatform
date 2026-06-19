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
    return NextResponse.redirect(appUrl("/onboarding?error=github_denied"));
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.redirect(appUrl("/login?callbackUrl=/onboarding"));
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error("GitHub token exchange failed:", tokenData);
    return NextResponse.redirect(appUrl("/onboarding?error=github_token_failed"));
  }

  const githubUserRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });

  const githubUser = await githubUserRes.json();

  if (!githubUser?.login) {
    console.error("GitHub user lookup failed:", githubUser);
    return NextResponse.redirect(appUrl("/onboarding?error=github_user_failed"));
  }

  await ConnectedAccount.findOneAndUpdate(
    { user_id: currentUser._id, platform: "github" },
    {
      $set: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        platform_username: githubUser.login,
        connected_at: new Date(),
        status: "active",
      },
    },
    { new: true, upsert: true, runValidators: true },
  );

  return NextResponse.redirect(appUrl("/onboarding?github=connected"));
}