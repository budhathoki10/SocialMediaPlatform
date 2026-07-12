import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { formatInstagramDraft } from "@/lib/instagram-drafts";
import { InstagramDraft, User } from "@/lib/models";

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

export async function GET() {
  const session = await getServerSession(authOptions);
  const currentUser = await getCurrentUser(session);

  if (!currentUser) {
    return NextResponse.json({ drafts: [] }, { status: 401 });
  }

  const drafts = await InstagramDraft.find({
    user_id: currentUser._id,
    status: "pending",
  })
    .sort({ created_at: -1 })
    .lean();

  const [totalDrafts, totalDmDrafts, totalCommentDrafts, sentToday] = await Promise.all([
    InstagramDraft.countDocuments({ user_id: currentUser._id, status: "pending" }),
    InstagramDraft.countDocuments({ user_id: currentUser._id, status: "pending", source: "dm" }),
    InstagramDraft.countDocuments({ user_id: currentUser._id, status: "pending", source: "comment" }),
    InstagramDraft.countDocuments({
      user_id: currentUser._id,
      status: "sent",
      created_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  return NextResponse.json({
    drafts: drafts.map(formatInstagramDraft),
    stats: {
      totalDrafts,
      totalDmDrafts,
      totalCommentDrafts,
      sentToday,
    },
  });
}
