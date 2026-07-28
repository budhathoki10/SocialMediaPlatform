// CRUD for comment auto-reply keyword rules: each rule is a keyword (matched
// case-insensitively, as a regex, against incoming comments) paired with the
// exact message to send back — see buildRuleBasedDraft in lib/auto-reply-rules.js.
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { AutoReplyRule, User } from "@/lib/models";

const MAX_KEYWORD_LENGTH = 200;
const MAX_REPLY_LENGTH = 1000;
const MAX_RULES_PER_USER = 50;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    createdAt: rule.created_at?.toISOString?.() || rule.created_at || null,
  };
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const rules = await AutoReplyRule.find({ user_id: currentUser._id }).sort({ created_at: 1 }).lean();

  return NextResponse.json({ rules: rules.map(formatRule) });
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

  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  const replyTemplate = typeof body.replyTemplate === "string" ? body.replyTemplate.trim() : "";

  if (!keyword || keyword.length > MAX_KEYWORD_LENGTH) {
    return NextResponse.json(
      { error: `Keyword is required and must be ${MAX_KEYWORD_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  if (!replyTemplate || replyTemplate.length > MAX_REPLY_LENGTH) {
    return NextResponse.json(
      { error: `Reply message is required and must be ${MAX_REPLY_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const existingCount = await AutoReplyRule.countDocuments({ user_id: currentUser._id });

  if (existingCount >= MAX_RULES_PER_USER) {
    return NextResponse.json(
      { error: `You can only have up to ${MAX_RULES_PER_USER} keyword rules.` },
      { status: 400 },
    );
  }

  const duplicate = await AutoReplyRule.findOne({
    user_id: currentUser._id,
    keyword: { $regex: `^${escapeRegExp(keyword)}$`, $options: "i" },
  }).lean();

  if (duplicate) {
    return NextResponse.json({ error: "A rule for this keyword already exists." }, { status: 409 });
  }

  try {
    const rule = await AutoReplyRule.create({
      user_id: currentUser._id,
      keyword,
      reply_template: replyTemplate,
    });

    return NextResponse.json({ rule: formatRule(rule) }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "A rule for this keyword already exists." }, { status: 409 });
    }
    throw error;
  }
}
