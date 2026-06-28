import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import {
  Post,
  User,
  getKathmanduDate,
  parseKathmanduDatetimeLocal,
} from "@/lib/models";
import { getPostExpirationDate } from "@/lib/post-retention-config";

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

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatNewsContent({ description, link }) {
  return [description, link ? `Read more: ${link}` : null].filter(Boolean).join("\n\n");
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

  const sourceRef = cleanText(body.source_ref);
  const title = cleanText(body.title);
  const description = cleanText(body.description);
  const link = cleanText(body.link);
  const scheduledTimeValue = cleanText(body.scheduled_time);

  if (!sourceRef) {
    return NextResponse.json({ error: "News source reference is required." }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "News title is required." }, { status: 400 });
  }

  if (!scheduledTimeValue) {
    return NextResponse.json({ error: "Schedule time is required." }, { status: 400 });
  }

  const scheduledTime = parseKathmanduDatetimeLocal(scheduledTimeValue);

  if (!scheduledTime || Number.isNaN(scheduledTime.getTime())) {
    return NextResponse.json({ error: "Schedule time is invalid." }, { status: 400 });
  }

  const createdAt = getKathmanduDate();
  const expiresAt = getPostExpirationDate(createdAt);

  if (scheduledTime < createdAt) {
    return NextResponse.json({ error: "Schedule time cannot be in the past." }, { status: 400 });
  }

  if (scheduledTime > expiresAt) {
    return NextResponse.json({ error: "News can only be scheduled within 10 days." }, { status: 400 });
  }

  const content = formatNewsContent({ description, link });

  const post = await Post.findOneAndUpdate(
    {
      user_id: currentUser._id,
      source: "tech_news",
      source_ref: sourceRef,
      status: { $ne: "published" },
    },
    {
      $set: {
        pr_title: title,
        content: content || title,
        source_url: link || null,
        scheduled_time: scheduledTime,
        expires_at: expiresAt,
        status: "scheduled",
      },
      $setOnInsert: {
        user_id: currentUser._id,
        source: "tech_news",
        source_ref: sourceRef,
        created_at: createdAt,
      },
    },
    { new: true, upsert: true },
  );

  return NextResponse.json({
    post: {
      _id: post._id.toString(),
      source_ref: post.source_ref,
      status: post.status,
      scheduled_time: post.scheduled_time?.toISOString() || null,
    },
  });
}
