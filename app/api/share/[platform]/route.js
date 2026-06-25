import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Post, PostPlatform, User, getKathmanduDate } from "@/lib/models";

const supportedPlatforms = new Set(["instagram", "facebook"]);

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

export async function POST(request, context) {
  const { platform } = await context.params;

  if (!supportedPlatforms.has(platform)) {
    return NextResponse.json({ error: "Unsupported sharing platform." }, { status: 400 });
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Login required." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const postId = typeof body.postId === "string" ? body.postId : "";
  if (!mongoose.isValidObjectId(postId)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const post = await Post.findOne({ _id: postId, user_id: currentUser._id }).select("_id");
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const publishedAt = getKathmanduDate();
  await Promise.all([
    Post.updateOne({ _id: post._id, user_id: currentUser._id }, { $set: { status: "published" } }),
    PostPlatform.findOneAndUpdate(
      { post_id: post._id, platform },
      { $set: { published_at: publishedAt, status: "published" } },
      { upsert: true, new: true },
    ),
  ]);

  return NextResponse.json({ ok: true, platform, status: "published" });
}
