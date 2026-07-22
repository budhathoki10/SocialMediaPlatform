import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { AutoReplyLog, User } from "@/lib/models";

const RECENT_LIMIT = 5;

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id && !session?.user?.email) {
    return null;
  }

  await connectDB();

  if (session.user.id) {
    const user = await User.findById(session.user.id).select("_id");
    if (user) return user;
  }

  if (session.user.email) {
    return User.findOne({ email: session.user.email }).select("_id");
  }

  return null;
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const logs = await AutoReplyLog.find({ user_id: currentUser._id })
    .sort({ created_at: -1 })
    .limit(RECENT_LIMIT)
    .lean();

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log._id.toString(),
      platform: log.platform,
      reply: log.reply_sent,
      createdAt: log.created_at?.toISOString?.() || log.created_at || null,
    })),
  });
}
