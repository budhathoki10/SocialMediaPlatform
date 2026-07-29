import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { AutoReplyRule, User } from "@/lib/models";

const MAX_KEYWORD_LENGTH = 200;
const MAX_REPLY_LENGTH = 1000;
const MAX_DM_LENGTH = 1000;

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id && !session?.user?.email) {
    return null;
  }

  await connectDB();

  if (session.user.id) {
    const user = await User.findById(session.user.id).select("_id");
    if (user) return user;
  }

  if (session.user.email) {
    return User.findOne({ email: session.user.email }).select("_id");
  }

  return null;
}

function formatRule(rule) {
  return {
    id: rule._id.toString(),
    keyword: rule.keyword,
    replyTemplate: rule.reply_template,
    dmTemplate: rule.dm_template || "",
    createdAt: rule.created_at?.toISOString?.() || rule.created_at || null,
  };
}

export async function PUT(request, { params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { ruleId } = await params;

  if (!mongoose.isValidObjectId(ruleId)) {
    return NextResponse.json({ error: "Invalid rule id." }, { status: 400 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update = {};

  if (typeof body.keyword === "string") {
    const keyword = body.keyword.trim();

    if (!keyword || keyword.length > MAX_KEYWORD_LENGTH) {
      return NextResponse.json(
        { error: `Keyword must be between 1 and ${MAX_KEYWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    update.keyword = keyword;
  }

  if (typeof body.replyTemplate === "string") {
    const replyTemplate = body.replyTemplate.trim();

    if (!replyTemplate || replyTemplate.length > MAX_REPLY_LENGTH) {
      return NextResponse.json(
        { error: `Reply message must be between 1 and ${MAX_REPLY_LENGTH} characters.` },
        { status: 400 },
      );
    }

    update.reply_template = replyTemplate;
  }

  if (typeof body.dmTemplate === "string") {
    const dmTemplate = body.dmTemplate.trim();

    if (dmTemplate.length > MAX_DM_LENGTH) {
      return NextResponse.json(
        { error: `DM message must be ${MAX_DM_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    }

    // Empty string clears it — a rule can go from "also DMs" back to
    // comment-reply-only without deleting and recreating it.
    update.dm_template = dmTemplate || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const rule = await AutoReplyRule.findOneAndUpdate(
      { _id: ruleId, user_id: currentUser._id },
      { $set: update },
      { new: true, runValidators: true },
    ).lean();

    if (!rule) {
      return NextResponse.json({ error: "Rule not found." }, { status: 404 });
    }

    return NextResponse.json({ rule: formatRule(rule) });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "A rule for this keyword already exists." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request, { params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { ruleId } = await params;

  if (!mongoose.isValidObjectId(ruleId)) {
    return NextResponse.json({ error: "Invalid rule id." }, { status: 400 });
  }

  const result = await AutoReplyRule.deleteOne({ _id: ruleId, user_id: currentUser._id });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Rule not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
