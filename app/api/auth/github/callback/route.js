// app/api/github/callback/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const installationId = searchParams.get("installation_id");

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/onboarding?error=github_denied`
    );
  }

  // exchange code for access token
  const tokenRes = await fetch(
    "https://github.com/login/oauth/access_token",
    {
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
    }
  );

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/onboarding?error=github_token_failed`
    );
  }

  // get GitHub user info
  const githubUserRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const githubUser = await githubUserRes.json();

  // save to MongoDB
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login`
    );
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $set: {
      githubAccessToken: tokenData.access_token,
      githubUsername: githubUser.login,
      githubInstallationId: installationId || null,
      isGithubConnected: true,
      githubConnectedAt: new Date(),
    },
  });

  // redirect back to onboarding with success
  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/onboarding?github=connected`
  );
}