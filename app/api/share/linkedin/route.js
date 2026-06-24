import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, Post, User } from "@/lib/models";

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

  const postId = typeof body.postId === "string" ? body.postId : "";

  if (!mongoose.isValidObjectId(postId)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const post = await Post.findOne({ _id: postId, user_id: currentUser._id })
    .select("pr_title content")
    .lean();

  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const account = await ConnectedAccount.findOne({
    user_id: currentUser._id,
    platform: "linkedin",
    status: "active",
  }).select("+access_token platform_user_id platform_username");

  if (!account) {
    return NextResponse.json({ error: "Connect LinkedIn before sharing." }, { status: 400 });
  }

  const linkedinUserId = account.platform_user_id || account.platform_username;
  const content = [post.pr_title, post.content].filter(Boolean).join("\n");
  
console.log("content is ",content)
  console.log("LinkedIn share test", {
    accessToken: account.access_token,
    linkedinUserId,
    content,
  });
const responses = await fetch("https://api.linkedin.com/rest/posts", {
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
if (!responses.ok) {
    const error = await response.json();
    throw new Error(`LinkedIn API failed: ${JSON.stringify(error)}`);
    
  }
  return NextResponse.json({
    ok: true,
    message: "LinkedIn share data logged on the server.",
  });
}
