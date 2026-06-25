import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Post, PostPlatform, User } from "@/lib/models";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const posts = await Post.find({ user_id: currentUser._id })
    .select("content pr_title pr_body status scheduled_time created_at source")
    .sort({ created_at: -1 })
    .limit(3)
    .lean();

  const publishedPlatforms = posts.length
    ? await PostPlatform.find({
        post_id: { $in: posts.map((post) => post._id) },
        status: "published",
      })
        .select("post_id platform")
        .lean()
    : [];
  const sharedPlatformsByPost = new Map();

  for (const platform of publishedPlatforms) {
    const postId = platform.post_id.toString();
    sharedPlatformsByPost.set(postId, [...(sharedPlatformsByPost.get(postId) || []), platform.platform]);
  }

  return NextResponse.json(
    {
      posts: posts.map((post) => ({
        _id: post._id.toString(),
        content: post.content,
        pr_title: post.pr_title || null,
        pr_body: post.pr_body || null,
        status: post.status,
        scheduled_time: post.scheduled_time?.toISOString() || null,
        created_at: post.created_at.toISOString(),
        source: post.source,
        shared_platforms: sharedPlatformsByPost.get(post._id.toString()) || [],
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
