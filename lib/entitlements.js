// Single source of truth for what each plan is allowed to do. Mirrors
// components/pricing/data.ts — if a limit changes there, change it here too.
// User.plan is kept in sync with the real Freemius subscription state by
// app/api/webhooks/freemius/route.js (activation/cancellation) and
// lib/subscriptions.js (hard expiry cutoff), so every check below can read
// it directly with no extra query.
import { InstagramDraft, Post, User } from "./models.js";

export const PLANS = ["free", "pro", "unlimited"];

export const PLAN_LIMITS = {
  free: {
    scheduledPostsPerMonth: 5,
    autoReplyAccess: false,
    autoRepliesPerMonth: 0,
    autoReplyKeywordRules: false,
    whatsappAccess: false,
    connectedAccountsPerPlatform: 1,
    analytics: "basic",
  },
  pro: {
    scheduledPostsPerMonth: Infinity,
    autoReplyAccess: true,
    autoRepliesPerMonth: 2000,
    autoReplyKeywordRules: true,
    whatsappAccess: true,
    connectedAccountsPerPlatform: 1,
    analytics: "full",
  },
  unlimited: {
    scheduledPostsPerMonth: Infinity,
    autoReplyAccess: true,
    autoRepliesPerMonth: Infinity,
    autoReplyKeywordRules: true,
    whatsappAccess: true,
    connectedAccountsPerPlatform: Infinity,
    analytics: "full",
  },
};

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function planAllowsAutoReply(plan) {
  return getPlanLimits(plan).autoReplyAccess;
}

export function planAllowsWhatsapp(plan) {
  return getPlanLimits(plan).whatsappAccess;
}

// Resolves a NextAuth session's user to their current plan. Assumes the
// caller has already called connectDB(). Shared by every server component
// that needs to gate a whole page on plan (e.g. Auto-Reply, WhatsApp).
export async function getPlanForSessionUser(sessionUser) {
  if (sessionUser?.id) {
    const user = await User.findById(sessionUser.id).select("plan").lean();
    if (user) return user.plan;
  }

  if (sessionUser?.email) {
    const user = await User.findOne({ email: sessionUser.email }).select("plan").lean();
    if (user) return user.plan;
  }

  return "free";
}

function startOfCalendarMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Matches the "5 Scheduled Posts / Month" wording on the pricing page —
// counts posts that were actually scheduled (scheduled_time set) this
// month, not drafts.
export async function countScheduledPostsThisMonth(userId) {
  return Post.countDocuments({
    user_id: userId,
    scheduled_time: { $ne: null },
    created_at: { $gte: startOfCalendarMonth() },
  });
}

// Matches "<N> AI Auto Replies / Month" — counts replies actually sent
// (not drafted/pending), since that's what a plan is paying for.
export async function countAutoRepliesThisMonth(userId) {
  return InstagramDraft.countDocuments({
    user_id: userId,
    status: "sent",
    sent_at: { $gte: startOfCalendarMonth() },
  });
}

export async function canScheduleAnotherPost(userId, plan) {
  const limit = getPlanLimits(plan).scheduledPostsPerMonth;
  if (limit === Infinity) return { allowed: true };

  const used = await countScheduledPostsThisMonth(userId);
  return { allowed: used < limit, used, limit };
}

export async function canSendAnotherAutoReply(userId, plan) {
  const limits = getPlanLimits(plan);
  if (!limits.autoReplyAccess) return { allowed: false, reason: "plan" };
  if (limits.autoRepliesPerMonth === Infinity) return { allowed: true };

  const used = await countAutoRepliesThisMonth(userId);
  return { allowed: used < limits.autoRepliesPerMonth, used, limit: limits.autoRepliesPerMonth };
}
