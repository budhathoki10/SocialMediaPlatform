import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, User } from "@/lib/models";

function connectedResponse(source, github) {
  return NextResponse.json({
    connected: true,
    platform: "github",
    authenticated: true,
    source,
    username: github.username || github.platform_username || null,
    connected_at: github.connected_at || null,
  });
}

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

  if (session.user.email) {
    return User.findOne({ email: session.user.email }).select("_id");
  }

  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const currentUser = await getCurrentUser(session);

  if (!currentUser) {
    return NextResponse.json({ connected: false, platform: "github", authenticated: false }, { status: 401 });
  }

  const account = await ConnectedAccount.findOne({
    user_id: currentUser._id,
    platform: "github",
    status: "active",
  })
    .select("platform_username connected_at status")
    .lean();

  if (!account) {
    return NextResponse.json({
      connected: false,
      platform: "github",
      authenticated: true,
      source: "database",
      username: null,
      connected_at: null,
    });
  }

  return connectedResponse("database", account);
}
