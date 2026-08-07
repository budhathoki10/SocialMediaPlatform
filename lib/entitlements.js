// Single source of truth for what each plan is allowed to do. Mirrors
// components/pricing/data.ts — if a limit changes there, change it here too.
// A user's plan is NOT stored on the User document — it's derived from the
// subscriptions collection via getCurrentPlan() below, so there's only one
// place that can ever go out of sync (there's nothing to sync — the plan
// IS whatever the most recent active/past_due Subscription says).
import { InstagramDraft, Post, Subscription, User } from "./models.js";

// Statuses that grant paid access — used both for the query below and by
// any caller (e.g. app/api/settings/route.js) that already has a
// Subscription doc in hand and wants the exact same "is this active" rule.
export const ACTIVE_PLAN_STATUSES = ["active", "past_due"];

// Pure helper: same derivation getCurrentPlan() uses, for callers that
// already fetched the user's Subscription doc themselves and don't want a
// second, redundant query just to get the plan.
export function planFromSubscription(subscription) {
  return subscription?.plan || "free";
}

// A user with no matching Subscription (never purchased, or their last one
// was cancelled/expired) is free — there's no "free" Subscription document,
// absence of an active one IS the free plan.
export async function getCurrentPlan(userId) {
  if (!userId) return "free";

  const subscription = await Subscription.findOne({ user_id: userId, status: { $in: ACTIVE_PLAN_STATUSES } })
    .sort({ created_at: -1 })
    .select("plan")
    .lean();

  return planFromSubscription(subscription);
}

// Same lookup as getCurrentPlan, but also returns billing_period — needed
// anywhere a plan tier alone isn't enough to know what the user is actually
// subscribed to (e.g. the pricing cards need to tell "Unlimited monthly"
// apart from "Unlimited yearly" to disable/enable the right card+toggle
// combination, not just the right plan tier).
export async function getCurrentPlanAndPeriod(userId) {
  if (!userId) return { plan: "free", billingPeriod: null };

  const subscription = await Subscription.findOne({ user_id: userId, status: { $in: ACTIVE_PLAN_STATUSES } })
    .sort({ created_at: -1 })
    .select("plan billing_period")
    .lean();

  return {
    plan: planFromSubscription(subscription),
    billingPeriod: subscription?.billing_period || null,
  };
}

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
  const userId = await resolveSessionUserId(sessionUser);
  return getCurrentPlan(userId);
}

// Same as getPlanForSessionUser, but includes billing_period — see
// getCurrentPlanAndPeriod for why that's sometimes needed.
export async function getPlanAndPeriodForSessionUser(sessionUser) {
  const userId = await resolveSessionUserId(sessionUser);
  return getCurrentPlanAndPeriod(userId);
}

async function resolveSessionUserId(sessionUser) {
  let userId = sessionUser?.id || null;

  if (!userId && sessionUser?.email) {
    const user = await User.findOne({ email: sessionUser.email }).select("_id").lean();
    userId = user?._id || null;
  }

  return userId;
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
