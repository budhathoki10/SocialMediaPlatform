import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { GithubEvent, User } from "@/lib/models";

function getRelativeTime(value) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

function mapActivityItem(activity, index) {
  return {
    id: activity._id.toString(),
    title: index === 0 ? "AI Agent generated a draft post" : `${activity.event_type.replaceAll("_", " ")} received`,
    description:
      index === 0
        ? `New draft created from ${activity.repo_name}.`
        : `${activity.repo_name} was processed by AutoPilot automation.`,
    time: getRelativeTime(activity.created_at),
    type: index === 0 ? "ai" : "success",
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

  const activities = await GithubEvent.find({ user_id: user._id })
    .select("repo_name event_type created_at")
    .sort({ created_at: -1 })
    .limit(3)
    .lean();

  return NextResponse.json({
    items: activities.map(mapActivityItem),
  });
}
