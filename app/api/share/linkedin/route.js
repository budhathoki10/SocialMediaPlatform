import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, Post, PostPlatform, User, getKathmanduDate } from "@/lib/models";

export async function getCurrentUser() {
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

  return User.findOne({ email: session.user.email }).select("_id");
}

export async function publishLinkedInPost({ postId, userId }) {
  console.log("i am  inside published to linked in post ")
  if (!mongoose.isValidObjectId(postId)) {
    return { ok: false, statusCode: 400, error: "Invalid post id." };
  }

  if (!mongoose.isValidObjectId(userId)) {
    return { ok: false, statusCode: 400, error: "Invalid user id." };
  }

  await connectDB();

  const post = await Post.findOne({ _id: postId, user_id: userId })
    .select("pr_title content")
    .lean();

  if (!post) {
    return { ok: false, statusCode: 404, error: "Post not found." };
  }

  const account = await ConnectedAccount.findOne({
    user_id: userId,
    platform: "linkedin",
    status: "active",
  }).select("+access_token platform_user_id platform_username");

  if (!account) {
    return { ok: false, statusCode: 400, error: "Connect LinkedIn before sharing." };
  }

  const linkedinUserId = account.platform_user_id || account.platform_username;
  const content = [post.pr_title, post.content].filter(Boolean).join("\n");

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202506",           // required — YYYYMM format
      "X-Restli-Protocol-Version": "2.0.0",  // required
    },
    body: JSON.stringify({
      author: `urn:li:person:${linkedinUserId}`,
      commentary: content,                    // "text" → "commentary" in new API
      visibility: "PUBLIC",                   // simplified from old nested object
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    return { ok: false, statusCode: response.status, error: `LinkedIn API failed: ${error}` };
  }

  const publishedAt = getKathmanduDate();
  const platformPostId = response.headers.get("x-restli-id");

  await Promise.all([
    Post.updateOne({ _id: post._id, user_id: userId }, { $set: { status: "published" } }),
    PostPlatform.findOneAndUpdate(
      { post_id: post._id, platform: "linkedin" },
      {
        $set: {
          platform_post_id: platformPostId,
          published_at: publishedAt,
          status: "published",
        },
      },
      { upsert: true, new: true },
    ),
  ]);

  return {
    ok: true,
    platform: "linkedin",
    platform_post_id: platformPostId,
    status: "published",
    message: "Post shared on LinkedIn.",
  };
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

  const result = await publishLinkedInPost({
    postId: typeof body.postId === "string" ? body.postId : "",
    userId: currentUser._id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode || 500 });
  }

  return NextResponse.json({
    ok: result.ok,
    platform: result.platform,
    status: result.status,
    message: result.message,
  });
}
