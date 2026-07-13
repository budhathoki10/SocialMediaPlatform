// in this file it recieves the code from instagram and exchanges it for an access token, fetches Instagram account info, then saves the connected account in MongoDB.


import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, User, getKathmanduDate } from "@/lib/models";

function appUrl(path) {
  return `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${path}`;
}

function getTokenExpirationDate(expiresIn) {
  const seconds = Number(expiresIn);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(Date.now() + seconds * 1000);
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id && !session?.user?.email) return null;

  await connectDB();

  if (session.user.id) {
    const user = await User.findById(session.user.id);
    if (user) return user;
  }

  return User.findOne({ email: session.user.email });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(appUrl("/onboarding?error=instagram_denied"));
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(appUrl("/login?callbackUrl=/onboarding"));
  }

  //  Exchange code for token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`,
      code,
    })
  );
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(appUrl("/onboarding?error=instagram_token_failed"));
  }

  // Get Facebook Pages
  const accountRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
  );
  const userData = await accountRes.json();

  //  no pages found
  if (!userData.data || userData.data.length === 0) {
    return NextResponse.redirect(appUrl("/onboarding?error=no_facebook_page"));
  }

  const pageId = userData.data[0].id;
  const pageAccessToken = userData.data[0].access_token;

  if (!pageAccessToken) {
    return NextResponse.redirect(appUrl("/onboarding?error=instagram_page_token_failed"));
  }

// Get Instagram account
  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username,name,biography,profile_picture_url,media_count,followers_count,follows_count}&access_token=${pageAccessToken}`
  );
  const igData = await igRes.json();

  const igAccount = igData.instagram_business_account;


  if (!igAccount) {
    return NextResponse.redirect(appUrl("/onboarding?error=no_instagram_linked"));
  }

  const expiresAt = getTokenExpirationDate(tokenData.expires_in);

  // save the instagram details in the connected accounts collection
  await ConnectedAccount.findOneAndUpdate(
    { user_id: currentUser._id, platform: "instagram" },
    {
      $set: {
        access_token: pageAccessToken,
        platform_user_id: igAccount.id,
        page_id: pageId,
        platform_username: igAccount.username || igAccount.name || igAccount.id,
        name: igAccount.name || igAccount.username || "",
        biography: igAccount.biography || "",
        totalpost: igAccount.media_count || 0,
        followers: igAccount.followers_count || 0,
        following: igAccount.follows_count || 0,
        profilePictureUrl: igAccount.profile_picture_url,
        expires_at: expiresAt,
        connected_at: getKathmanduDate(),
        status: "active",
      },
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  return NextResponse.redirect(appUrl("/onboarding?instagram=connected"));
}
