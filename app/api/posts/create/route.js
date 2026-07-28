import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Post, PostPlatform, User, getKathmanduDate, parseKathmanduDatetimeLocal } from "@/lib/models";
import { getPostExpirationDate } from "@/lib/post-retention-config";

const MANUAL_POST_PLATFORM = "linkedin";
const MAX_CONTENT_LENGTH = 3000;
const MAX_MEDIA_URL_LENGTH = 6_000_000; // ~4.3MB of base64 (covers the 4MB image cap the composer enforces)

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

  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Post content is required." }, { status: 400 });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `Post content must be ${MAX_CONTENT_LENGTH} characters or fewer.` }, { status: 400 });
  }

  const createdAt = getKathmanduDate();
  const expiresAt = getPostExpirationDate(createdAt);
  let scheduledTime = null;

  if (body.scheduled_time) {
    scheduledTime = parseKathmanduDatetimeLocal(body.scheduled_time);

    if (!scheduledTime || Number.isNaN(scheduledTime.getTime())) {
      return NextResponse.json({ error: "Schedule time is invalid." }, { status: 400 });
    }

    if (scheduledTime > expiresAt) {
      return NextResponse.json({ error: "Posts can only be scheduled within 10 days." }, { status: 400 });
    }
  }

  let mediaUrl = null;

  if (typeof body.media_url === "string" && body.media_url.trim()) {
    const trimmedMediaUrl = body.media_url.trim();

    if (!trimmedMediaUrl.startsWith("data:image/") && !/^https?:\/\//.test(trimmedMediaUrl)) {
      return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
    }

    if (trimmedMediaUrl.length > MAX_MEDIA_URL_LENGTH) {
      return NextResponse.json({ error: "Image is too large." }, { status: 400 });
    }

    mediaUrl = trimmedMediaUrl;
  }

  const status = scheduledTime ? "scheduled" : "draft";

  const post = await Post.create({
    user_id: currentUser._id,
    content,
    media_url: mediaUrl,
    status,
    scheduled_time: scheduledTime,
    source: "manual",
    created_at: createdAt,
    expires_at: expiresAt,
  });

  await PostPlatform.create({
    post_id: post._id,
    platform: MANUAL_POST_PLATFORM,
    status: "pending",
  });

  return NextResponse.json(
    {
      post: {
        _id: post._id.toString(),
        content: post.content,
        pr_title: post.pr_title || null,
        pr_body: post.pr_body || null,
        media_url: post.media_url || null,
        status: post.status,
        scheduled_time: post.scheduled_time?.toISOString() || null,
        created_at: post.created_at.toISOString(),
        source: post.source,
        platform: MANUAL_POST_PLATFORM,
      },
    },
    { status: 201 },
  );
}