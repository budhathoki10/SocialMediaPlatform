import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { AutoReplySettings, User } from "@/lib/models";

const TONE_VALUES = ["professional", "friendly", "creative", "concise"];
const EMOJI_VALUES = ["none", "minimal", "moderate"];
const LENGTH_VALUES = ["short", "standard", "detailed"];
const GREETING_VALUES = ["first_name", "generic"];

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

function formatSettings(doc) {
  return {
    enabled: doc.enabled,
    tone: doc.tone,
    aiSemanticAnalysis: doc.ai_semantic_analysis,
    followUpDelay: doc.follow_up_delay,
    spamFiltering: doc.spam_filtering,
    platformPermissions: {
      linkedin: doc.platform_permissions?.linkedin ?? false,
      x: doc.platform_permissions?.x ?? false,
      instagram: doc.platform_permissions?.instagram ?? false,
      whatsapp: doc.platform_permissions?.whatsapp ?? false,
    },
    contactFiltering: {
      mutualConnectionsOnly: doc.contact_filtering?.mutual_connections_only ?? false,
      verifiedProfiles: doc.contact_filtering?.verified_profiles ?? false,
    },
    keywordExclusions: doc.keyword_exclusions || [],
    humanFallbackThreshold: doc.human_fallback_threshold,
    responseStyle: {
      emojiUsage: doc.response_style?.emoji_usage,
      responseLength: doc.response_style?.response_length,
      greetingStyle: doc.response_style?.greeting_style,
      signOffStyle: doc.response_style?.sign_off_style,
      customSignOff: doc.response_style?.custom_sign_off,
      linkCtaEnabled: doc.response_style?.link_cta_enabled,
      maxRepliesPerContact: doc.response_style?.max_replies_per_contact,
      businessHoursAware: doc.response_style?.business_hours_aware,
    },
  };
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const settings = await AutoReplySettings.findOne({ user_id: currentUser._id }).lean();

  if (!settings) {
    return NextResponse.json({ settings: formatSettings(new AutoReplySettings().toObject()) });
  }

  return NextResponse.json({ settings: formatSettings(settings) });
}

export async function PUT(request) {
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

  const update = { updated_at: new Date() };

  if (typeof body.enabled === "boolean") update.enabled = body.enabled;
  if (TONE_VALUES.includes(body.tone)) update.tone = body.tone;
  if (typeof body.aiSemanticAnalysis === "boolean") update.ai_semantic_analysis = body.aiSemanticAnalysis;
  if (typeof body.followUpDelay === "boolean") update.follow_up_delay = body.followUpDelay;
  if (typeof body.spamFiltering === "boolean") update.spam_filtering = body.spamFiltering;

  if (body.platformPermissions && typeof body.platformPermissions === "object") {
    for (const key of ["linkedin", "x", "instagram", "whatsapp"]) {
      if (typeof body.platformPermissions[key] === "boolean") {
        update[`platform_permissions.${key}`] = body.platformPermissions[key];
      }
    }
  }

  if (body.contactFiltering && typeof body.contactFiltering === "object") {
    if (typeof body.contactFiltering.mutualConnectionsOnly === "boolean") {
      update["contact_filtering.mutual_connections_only"] = body.contactFiltering.mutualConnectionsOnly;
    }
    if (typeof body.contactFiltering.verifiedProfiles === "boolean") {
      update["contact_filtering.verified_profiles"] = body.contactFiltering.verifiedProfiles;
    }
  }

  if (Array.isArray(body.keywordExclusions)) {
    update.keyword_exclusions = body.keywordExclusions
      .filter((word) => typeof word === "string" && word.trim())
      .map((word) => word.trim())
      .slice(0, 50);
  }

  if (Number.isFinite(body.humanFallbackThreshold)) {
    update.human_fallback_threshold = Math.min(100, Math.max(0, body.humanFallbackThreshold));
  }

  if (body.responseStyle && typeof body.responseStyle === "object") {
    const style = body.responseStyle;

    if (EMOJI_VALUES.includes(style.emojiUsage)) update["response_style.emoji_usage"] = style.emojiUsage;
    if (LENGTH_VALUES.includes(style.responseLength)) update["response_style.response_length"] = style.responseLength;
    if (GREETING_VALUES.includes(style.greetingStyle)) update["response_style.greeting_style"] = style.greetingStyle;
    if (typeof style.signOffStyle === "string") update["response_style.sign_off_style"] = style.signOffStyle;
    if (typeof style.customSignOff === "string") update["response_style.custom_sign_off"] = style.customSignOff.trim();
    if (typeof style.linkCtaEnabled === "boolean") update["response_style.link_cta_enabled"] = style.linkCtaEnabled;
    if (Number.isFinite(style.maxRepliesPerContact)) {
      update["response_style.max_replies_per_contact"] = Math.min(20, Math.max(0, style.maxRepliesPerContact));
    }
    if (typeof style.businessHoursAware === "boolean") {
      update["response_style.business_hours_aware"] = style.businessHoursAware;
    }
  }

  const settings = await AutoReplySettings.findOneAndUpdate(
    { user_id: currentUser._id },
    { $set: update, $setOnInsert: { user_id: currentUser._id, created_at: new Date() } },
    { new: true, upsert: true, runValidators: true },
  ).lean();

  return NextResponse.json({ settings: formatSettings(settings) });
}
