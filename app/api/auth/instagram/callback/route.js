// in this file it recieves the code from instagram and exchanges it for an access token, fetches Instagram account info, then saves the connected account in MongoDB.
//
// This is the Instagram-native "Instagram API with Instagram Login" flow, not the old
// Facebook Login for Business flow. The Instagram Business account authenticates directly
// through instagram.com/graph.instagram.com — there is intentionally NO Facebook Page
// lookup step here. If you're tempted to add a `me/accounts` Page lookup back in, don't:
// this Meta app is only configured (in the developer dashboard) for the native product,
// so Page-based endpoints will reject its client_id/secret.

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logActivity } from "@/lib/activity";
import { uploadProfilePictureFromUrl } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, User, getKathmanduDate } from "@/lib/models";

function appUrl(path) {
  return `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${path}`;
}

// Having the webhook URL configured in the Meta App Dashboard is not enough —
// under the native "Instagram API with Instagram Login" flow, each connected
// IG account has to be explicitly subscribed to receive messaging/comment
// events for our app. Without this call, POST /webhook never fires for that
// account even though the token exchange above succeeded. Non-fatal: log and
// let the connect flow finish, since the account is still usable for posting.
async function subscribeInstagramAccountToWebhooks(igUserId, accessToken) {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${igUserId}/subscribed_apps`,
      {
        method: "POST",
        body: new URLSearchParams({
          subscribed_fields: "messages,comments",
          access_token: accessToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.success) {
      console.error("Instagram webhook subscription failed:", response.status, data);
    }
  } catch (error) {
    console.error("Instagram webhook subscription request failed:", error?.message || error);
  }
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

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`;

  // Step 1: exchange the code for a short-lived (~1hr) access token.
  // Native login's token endpoint lives on api.instagram.com and takes a form-encoded
  // POST body — it is a different host, shape, and app credential pair than the old
  // graph.facebook.com/oauth/access_token call this route used to make.
  const shortTokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  const shortTokenData = await shortTokenRes.json();

  if (!shortTokenData.access_token) {
    return NextResponse.redirect(appUrl("/onboarding?error=instagram_token_failed"));
  }

  // NOTE: api.instagram.com's token response also includes a `user_id` field, but do NOT
  // use it — it comes back as a bare JSON number, and Instagram's numeric IDs (17+ digits)
  // exceed Number.MAX_SAFE_INTEGER, so response.json() silently rounds it to the wrong
  // value. graph.instagram.com correctly returns IDs as strings, so `/me`'s own `user_id`
  // field (fetched in step 3 below) is the precision-safe source for that same ID.

  // Step 2: immediately exchange the short-lived token for a long-lived (60 day) token.
  // This is a graph.instagram.com call — separate host from the short-lived exchange above.
  const longTokenRes = await fetch(
    `https://graph.instagram.com/access_token?` +
      new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        access_token: shortTokenData.access_token,
      })
  );
  const longTokenData = await longTokenRes.json();

  if (!longTokenData.access_token) {
    console.error("Instagram long-lived token exchange failed:", longTokenRes.status, longTokenData);
    return NextResponse.redirect(appUrl("/onboarding?error=instagram_long_token_failed"));
  }

  // Step 3: fetch the Instagram Business account's own profile directly via
  // graph.instagram.com/me. No Facebook Page lookup: native login authenticates the
  // IG Business account itself, so there's no Page -> instagram_business_account hop.
  // `user_id` here is the same account, but under the ID format Meta actually puts in
  // messaging webhook payloads (entry.id, sender.id, recipient.id) — `id` is a different
  // ID used for Graph API calls. Do not swap platform_user_id below back to `igAccount.id`
  // or webhook matching in app/api/auth/instagram/webhook/route.js will silently break.
  const igRes = await fetch(
    `https://graph.instagram.com/v21.0/me?` +
      new URLSearchParams({
        fields: "id,user_id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count",
        access_token: longTokenData.access_token,
      })
  );
  const igAccount = await igRes.json();

  if (!igAccount?.id) {
    return NextResponse.redirect(appUrl("/onboarding?error=no_instagram_linked"));
  }

  const expiresAt = getTokenExpirationDate(longTokenData.expires_in);

  // Mirror Meta's short-lived profile picture CDN link into Cloudinary so it
  // doesn't rot; public_id is the stable IG user id so reconnects overwrite
  // the same asset instead of piling up storage. Falls back to Meta's own
  // URL if Cloudinary isn't configured or the upload fails.
  const platformUserId = igAccount.user_id || igAccount.id;
  const cloudinaryProfilePictureUrl = await uploadProfilePictureFromUrl(igAccount.profile_picture_url, {
    publicId: platformUserId,
    folder: "AutoPilot/instagram/profiles",
  });

  // save the instagram details in the connected accounts collection
  await ConnectedAccount.findOneAndUpdate(
    { user_id: currentUser._id, platform: "instagram" },
    {
      $set: {
        access_token: longTokenData.access_token,
        platform_user_id: platformUserId,
        platform_username: igAccount.username || igAccount.name || igAccount.id,
        name: igAccount.name || igAccount.username || "",
        biography: igAccount.biography || "",
        totalpost: igAccount.media_count || 0,
        followers: igAccount.followers_count || 0,
        following: igAccount.follows_count || 0,
        profilePictureUrl: cloudinaryProfilePictureUrl || igAccount.profile_picture_url,
        expires_at: expiresAt,
        connected_at: getKathmanduDate(),
        status: "active",
      },
      // no Facebook Page in this flow — clear out any page_id left over from a
      // previous connection made under the old Facebook Login for Business flow.
      $unset: { page_id: "" },
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  // graph.instagram.com calls use igAccount.id, not the user_id/platformUserId
  // used for matching webhook payloads — see the note on Step 3 above.
  await subscribeInstagramAccountToWebhooks(igAccount.id, longTokenData.access_token);

  await logActivity({
    userId: currentUser._id,
    type: "account_connected",
    platform: "instagram",
    title: "Account connected",
    description: `Instagram account @${igAccount.username || igAccount.name || igAccount.id} connected to AutoPilot.`,
  });

  return NextResponse.redirect(appUrl("/onboarding?instagram=connected"));
}
