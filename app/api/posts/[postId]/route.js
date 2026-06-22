import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Post, User } from "@/lib/models";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

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

export async function PATCH(request, context) {
  const { postId } = await context.params;

  if (!mongoose.isValidObjectId(postId)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

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

  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Post content is required." }, { status: 400 });
  }

  let scheduledTime = null;

  if (body.scheduled_time) {
    scheduledTime = new Date(body.scheduled_time);

    if (Number.isNaN(scheduledTime.getTime())) {
      return NextResponse.json({ error: "Schedule time is invalid." }, { status: 400 });
    }
  }

  const post = await Post.findOne({ _id: postId, user_id: currentUser._id });

  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  post.content = content;
  post.scheduled_time = scheduledTime;

  if (scheduledTime && ["draft", "scheduled"].includes(post.status)) {
    post.status = "scheduled";
  }

  if (!scheduledTime && post.status === "scheduled") {
    post.status = "draft";
  }

  await post.save();

  return NextResponse.json({
    post: {
      _id: post._id.toString(),
      content: post.content,
      pr_title: post.pr_title,
      pr_body: post.pr_body,
      status: post.status,
      scheduled_time: post.scheduled_time?.toISOString() || null,
      created_at: post.created_at.toISOString(),
      source: post.source,
    },
  });
}