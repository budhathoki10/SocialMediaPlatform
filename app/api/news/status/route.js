import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Post, User } from "@/lib/models";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id && !session?.user?.email) return null;

  await connectDB();

  if (session.user.id) {
    const user = await User.findById(session.user.id).select("_id");
    if (user) return user;
  }

  return User.findOne({ email: session.user.email }).select("_id");
}

export async function POST(request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sourceRefs = Array.isArray(body.source_refs)
    ? body.source_refs.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim())
    : [];

  if (sourceRefs.length === 0) {
    return NextResponse.json({ statuses: {} }, { headers: { "Cache-Control": "no-store" } });
  }

  const posts = await Post.find({
    user_id: currentUser._id,
    source: "tech_news",
    source_ref: { $in: sourceRefs },
  })
    .select("_id source_ref status scheduled_time")
    .sort({ created_at: -1 })
    .lean();

  const statuses = {};

  for (const post of posts) {
    if (!post.source_ref || statuses[post.source_ref]) continue;

    statuses[post.source_ref] = {
      post_id: post._id.toString(),
      status: post.status,
      scheduled_time: post.scheduled_time?.toISOString() || null,
    };
  }

  return NextResponse.json({ statuses }, { headers: { "Cache-Control": "no-store" } });
}
