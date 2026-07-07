import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, User, getKathmanduDate } from "@/lib/models";

function appUrl(path) {
  return `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${path}`;
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
  console.log("token data", tokenData);

  if (!tokenData.access_token) {
    return NextResponse.redirect(appUrl("/onboarding?error=instagram_token_failed"));
  }

  // Get Facebook Pages
  const accountRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
  );
  const userData = await accountRes.json();
  console.log("pages data", userData);

  //  no pages found
  if (!userData.data || userData.data.length === 0) {
    return NextResponse.redirect(appUrl("/onboarding?error=no_facebook_page"));
  }

  const pageId = userData.data[0].id;
  const pageAccessToken = userData.data[0].access_token;

// Get Instagram account
  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${pageAccessToken}`
  );
  const igData = await igRes.json();
  console.log("instagram account", igData);

  const igAccount = igData.instagram_business_account;
  console.log("igaccount", igAccount);


  if (!igAccount) {
    return NextResponse.redirect(appUrl("/onboarding?error=no_instagram_linked"));
  }


  await ConnectedAccount.findOneAndUpdate(
    { user_id: currentUser._id, platform: "instagram" },
    {
      $set: {
        access_token: tokenData.access_token,
        platform_user_id: igAccount.id,
        platform_username: igAccount.username || igAccount.name,
        profilePictureUrl: igAccount.profile_picture_url,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
        connected_at: getKathmanduDate(),
        status: "active",
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  return NextResponse.redirect(appUrl("/onboarding?instagram=connected"));
}