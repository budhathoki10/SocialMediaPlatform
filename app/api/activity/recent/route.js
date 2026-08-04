import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ActivityLog, User } from "@/lib/models";

const TYPE_TO_UI = {
  draft_generated: "ai",
  post_published: "success",
  post_scheduled: "scheduled",
  account_connected: "connection",
  account_disconnected: "disconnection",
};

function getRelativeTime(value) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

function mapActivityItem(activity) {
  return {
    id: activity._id.toString(),
    title: activity.title,
    description: activity.description,
    time: getRelativeTime(activity.created_at),
    type: TYPE_TO_UI[activity.type] || "success",
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user;

  if (!sessionUser?.id && !sessionUser?.email) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  await connectDB();

  const userQuery = sessionUser.id ? { _id: sessionUser.id } : { email: sessionUser.email };
  const user = await User.findOne(userQuery).select("_id").lean();

  if (!user?._id) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const activities = await ActivityLog.find({ user_id: user._id })
    .select("type platform title description created_at")
    .sort({ created_at: -1 })
    .limit(3)
    .lean();

  return NextResponse.json({
    items: activities.map(mapActivityItem),
  });
}
