import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, User } from "@/lib/models";

export const dynamic = "force-dynamic";

async function getCurrentUser(session) {
  if (!session?.user?.id && !session?.user?.email) {
    return null;
  }

  await connectDB();

  if (session.user.id) {
    const user = await User.findById(session.user.id).select("_id");

    if (user) {
      return user;
    }
  }

  return User.findOne({ email: session.user.email }).select("_id");
}

function formatInstagramAccount(account) {
  return {
    connected: true,
    platform: "instagram",
    status: account.status,
    platform_user_id: account.platform_user_id || null,
    username: account.platform_username || null,
    name: account.name || account.platform_username || null,
    biography: account.biography || "",
    totalpost: account.totalpost || 0,
    followers: account.followers || 0,
    following: account.following || 0,
    profilePictureUrl: account.profilePictureUrl || null,
    connected_at: account.connected_at?.toISOString?.() || account.connected_at || null,
    expires_at: account.expires_at?.toISOString?.() || account.expires_at || null,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const currentUser = await getCurrentUser(session);

  if (!currentUser) {
    return NextResponse.json({ connected: false, authenticated: false, platform: "instagram" }, { status: 401 });
  }

  const account = await ConnectedAccount.findOne({
    user_id: currentUser._id,
    platform: "instagram",
    status: "active",
  })
    .select("platform_user_id platform_username name biography totalpost followers following profilePictureUrl connected_at expires_at status")
    .lean();

  if (!account) {
    return NextResponse.json({
      connected: false,
      authenticated: true,
      platform: "instagram",
      profile: null,
    });
  }

  return NextResponse.json({
    connected: true,
    authenticated: true,
    platform: "instagram",
    profile: formatInstagramAccount(account),
  });
}
