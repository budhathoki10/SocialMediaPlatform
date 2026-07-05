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
  // console.log("_______________________________________________________________________________________________________________--")
  // console.log("inside call back")
  // console.log("_______________________________________________________________________________________________________________--")
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(appUrl("/onboarding?error=instagram_denied"));
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.redirect(appUrl("/login?callbackUrl=/onboarding"));
  }

const tokenRes = await fetch(
  `https://graph.facebook.com/v18.0/oauth/access_token?` +
  new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID,     // 2521181031665804
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET, // from App Settings → Basic
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`,
    code: code,
  })
);

const tokenData = await tokenRes.json();
console.log("token data", tokenData);

    if (!tokenData.access_token) {
      return NextResponse.redirect(appUrl("/onboarding?error=instagram_denied"));
    }
    console.log(tokenData)
//  now we have the access token, we can use it to get the user's Instagram account info
const accountRes = await fetch(
  `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
)
const userData = await accountRes.json();
console.log("pages data", userData);

const pageId = userData.data[0].id;
const igRes = await fetch(
  `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username,name}&access_token=${tokenData.access_token}`
);
// console.log("____________________________________________________________________________________________________")
const igData = await igRes.json();
console.log("instagram account", igData);
const igAccount = igData.instagram_business_account;
console.log("igaccount",igAccount)

  return NextResponse.redirect(appUrl("/onboarding?instagram=connected"));
}
