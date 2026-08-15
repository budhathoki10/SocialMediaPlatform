import mongoose from "mongoose";

import { POST_RETENTION_MS } from "./post-retention-config.js";

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;
export const KATHMANDU_TIME_ZONE = "Asia/Kathmandu";

const KATHMANDU_OFFSET_MINUTES = 5 * 60 + 45;
const KATHMANDU_OFFSET_MS = KATHMANDU_OFFSET_MINUTES * 60 * 1000;
const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

export function getKathmanduDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return date;

  return new Date(date.getTime() + KATHMANDU_OFFSET_MS);
}

const getKathmanduDateDefault = () => getKathmanduDate();

// Real UTC instant for the most recent Kathmandu midnight (00:00 Asia/Kathmandu)
// on or before `value`. Use this for "resets once per calendar day" logic —
// unlike getKathmanduDate(), the returned Date is a genuine instant safe to
// compare against timestamps stored via `new Date()`.
export function getStartOfKathmanduDay(value = new Date()) {
  const shifted = getKathmanduDate(value);
  const startOfShiftedDay = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());

  return new Date(startOfShiftedDay - KATHMANDU_OFFSET_MS);
}

// Valid values are 1, or any integer > 2 (uncapped) — 2 is disallowed, snaps up to 3.
export function normalizeMaxRepliesPerContact(value) {
  const rounded = Math.round(Number(value));

  if (!Number.isFinite(rounded) || rounded <= 1) return 1;
  if (rounded === 2) return 3;

  return rounded;
}

export function parseKathmanduDatetimeLocal(value) {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();

  if (!trimmedValue) return null;

  const match = trimmedValue.match(DATETIME_LOCAL_PATTERN);

  if (!match) return getKathmanduDate(trimmedValue);

  const [, year, month, day, hour, minute, second = "0"] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );
}

export const platformValues = [
  "linkedin",
  "instagram",
  "github",
  "whatsapp",
];

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    avatar_url: { type: String, default: null },
    // No `plan` field here on purpose — a user's current plan is derived,
    // not stored redundantly. See getCurrentPlan() in lib/entitlements.js:
    // it's whatever their most recent active/past_due Subscription says,
    // or "free" if they have no Subscription at all.
    timezone: { type: String, default: KATHMANDU_TIME_ZONE },
    created_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "users" },
);

const connectedAccountSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    platform: { type: String, enum: platformValues, required: true },
    access_token: { type: String, required: true, select: false },
    refresh_token: { type: String, default: null, select: false },
    platform_user_id: { type: String, default: null, trim: true },
    page_id: { type: String, default: null, trim: true },
    platform_username: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    biography: { type: String },
    totalpost: { type: Number, min: 0 },
    followers: { type: Number, min: 0 },
    following: { type: Number, min: 0 },
    profilePictureUrl: { type: String },
    connected_at: { type: Date, default: getKathmanduDateDefault },
    status: { type: String, enum: ["active", "expired", "revoked", "error"], default: "active" },
  },
  { collection: "connected_accounts" },
);

connectedAccountSchema.index({ user_id: 1, platform: 1 }, { unique: true });

const preferenceSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, unique: true },
    default_tone: { type: String, default: "professional", trim: true },
    auto_reply_enabled: { type: Boolean, default: false },
    tech_news_auto_post: { type: Boolean, default: false },
    news_sources: { type: [String], default: [] },
    posting_time: { type: String, default: "09:00" },
  },
  { collection: "preferences" },
);

const postSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    content: { type: String, required: true },
    pr_title: { type: String, default: null, trim: true },
    pr_body: { type: String, default: null },
    media_url: { type: String, default: null },
    source_ref: { type: String, default: null, trim: true, index: true },
    source_url: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "failed", "cancelled"],
      default: "draft",
      index: true,
    },
    scheduled_time: { type: Date, default: null, index: true },
    created_at: { type: Date, default: getKathmanduDateDefault },
    expires_at: { type: Date, default: () => new Date(getKathmanduDate().getTime() + POST_RETENTION_MS) },
    source: {
      type: String,
      enum: ["manual", "tech_news", "github_event", "automation"],
      default: "manual",
    },
  },
  { collection: "posts" },
);

postSchema.index({ user_id: 1, status: 1, scheduled_time: 1 });
postSchema.index({ user_id: 1, source: 1, source_ref: 1 });
postSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0, name: "post_expiration_ttl" });
const postPlatformSchema = new Schema(
  {
    post_id: { type: objectId, ref: "Post", required: true, index: true },
    platform: { type: String, enum: platformValues, required: true },
    platform_post_id: { type: String, default: null },
    published_at: { type: Date, default: getKathmanduDateDefault },
    status: { type: String, enum: ["pending", "published", "failed"], default: "pending" },
  },
  { collection: "post_platforms" },
);

postPlatformSchema.index({ post_id: 1, platform: 1 }, { unique: true });

const autoReplyRuleSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    keyword: { type: String, required: true, trim: true },
    reply_template: { type: String, required: true },
    // Optional. When set, a matching comment also gets this message sent as
    // an Instagram private reply (a DM tied to the comment) — see
    // sendInstagramPrivateReply in lib/instagram-drafts.js. Meta only allows
    // one private reply per comment, so this is separate from reply_template
    // specifically so the public comment reply can stay generic/link-free
    // while the DM carries the real content.
    dm_template: { type: String, default: null },
    created_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "auto_reply_rules" },
);

autoReplyRuleSchema.index({ user_id: 1, keyword: 1 }, { unique: true });

const autoReplyLogSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    platform: { type: String, enum: platformValues, required: true },
    sender_name: { type: String, default: null, trim: true },
    sender_username: { type: String, default: null, trim: true },
    sender_profile_picture_url: { type: String, default: null, trim: true },
    original_comment: { type: String, required: true },
    reply_sent: { type: String, required: true },
    created_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "auto_reply_logs" },
);

autoReplyLogSchema.index({ user_id: 1, platform: 1, created_at: -1 });

const githubEventSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    repo_name: { type: String, required: true, trim: true },
    event_type: { type: String, required: true, trim: true },
    post_id: { type: objectId, ref: "Post", default: null },
    created_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "github_events" },
);

githubEventSchema.index({ user_id: 1, repo_name: 1, created_at: -1 });

const activityLogSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["draft_generated", "post_published", "post_scheduled", "account_connected", "account_disconnected"],
      required: true,
    },
    platform: { type: String, enum: platformValues, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    post_id: { type: objectId, ref: "Post", default: null },
    created_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "activity_logs" },
);

activityLogSchema.index({ user_id: 1, created_at: -1 });

const analyticsSchema = new Schema(
  {
    post_id: { type: objectId, ref: "Post", required: true, index: true },
    platform: { type: String, enum: platformValues, required: true },
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    recorded_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "analytics" },
);

analyticsSchema.index({ post_id: 1, platform: 1, recorded_at: -1 });

const instagramDraftSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    connected_account_id: { type: objectId, ref: "ConnectedAccount", default: null, index: true },
    platform_user_id: { type: String, default: null, trim: true, index: true },
    external_id: { type: String, required: true, trim: true },
    source: { type: String, enum: ["dm", "comment"], required: true, index: true },
    platform_comment_id: { type: String, default: null, trim: true, index: true },
    sender_id: { type: String, default: null, trim: true },
    sender_name: { type: String, default: null, trim: true },
    sender_username: { type: String, default: "instagram_user", trim: true },
    sender_profile_picture_url: { type: String, default: null, trim: true },
    original_message: { type: String, required: true },
    draft_reply: { type: String, required: true },
    confidence: { type: Number, default: null, min: 0, max: 100 },
    tone: { type: String, enum: ["ready", "needs_review", "blocked"], default: "ready", index: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "sent"], default: "pending", index: true },
    sent_at: { type: Date, default: null },
    platform_message_id: { type: String, default: null, trim: true },
    // Carried over from the matched keyword rule's dm_template (see
    // autoReplyRuleSchema above) so send-time still has it even if the rule
    // is edited/deleted later. Null means no private reply is sent.
    dm_template: { type: String, default: null },
    // Meta allows only one private reply per comment ever — this timestamp
    // is the guard against attempting a second send on retries/re-approval.
    private_reply_sent_at: { type: Date, default: null },
    created_at: { type: Date, default: getKathmanduDateDefault },
    updated_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "instagram_drafts" },
);

instagramDraftSchema.index({ user_id: 1, external_id: 1 }, { unique: true });
instagramDraftSchema.index({ user_id: 1, status: 1, created_at: -1 });

const autoReplySettingsSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    tone: {
      type: String,
      enum: ["professional", "friendly", "creative", "concise"],
      default: "friendly",
    },
    ai_semantic_analysis: { type: Boolean, default: true },
    follow_up_delay: { type: Boolean, default: true },
    spam_filtering: { type: Boolean, default: true },
    platform_permissions: {
      linkedin: { type: Boolean, default: false },
      instagram: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
    contact_filtering: {
      mutual_connections_only: { type: Boolean, default: false },
      verified_profiles: { type: Boolean, default: false },
    },
    keyword_exclusions: { type: [String], default: [] },
    human_fallback_threshold: { type: Number, default: 70, min: 0, max: 100 },
    response_style: {
      emoji_usage: { type: String, enum: ["none", "minimal", "moderate"], default: "minimal" },
      response_length: { type: String, enum: ["short", "standard", "detailed"], default: "standard" },
      greeting_style: { type: String, enum: ["first_name", "generic"], default: "first_name" },
      sign_off_style: { type: String, default: "none" },
      custom_sign_off: { type: String, default: "Team" },
      link_cta_enabled: { type: Boolean, default: true },
      // When off (default), no per-contact daily cap applies — AI replies to
      // the same person as often as needed, bounded only by the plan's
      // overall monthly auto-reply quota (see lib/entitlements.js). When on,
      // max_replies_per_contact caps replies to that one person per day.
      max_replies_per_contact_enabled: { type: Boolean, default: false },
      max_replies_per_contact: { type: Number, default: 1, min: 1, set: normalizeMaxRepliesPerContact },
      business_hours_aware: { type: Boolean, default: false },
      business_hours_start: { type: String, default: "09:00" },
      business_hours_end: { type: String, default: "18:00" },
    },
    created_at: { type: Date, default: getKathmanduDateDefault },
    updated_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "auto_reply_settings" },
);

const subscriptionSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["free", "pro", "unlimited"], required: true },
    billing_period: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    status: {
      type: String,
      // "canceled" = the user (or Freemius) explicitly ended it — a real
      // cancellation, set from the license.cancelled/subscription.cancelled
      // webhooks. "expired" = Freemius's license.expired webhook told us the
      // license ran out. Neither is the actual access gate any more — see
      // the note below on current_period_end.
      enum: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "expired",
        "incomplete",
        "incomplete_expired",
        "free_trial",
      ],
      default: "active",
      index: true,
    },
    provider: { type: String, enum: ["freemius"], default: "freemius" },
    provider_customer_id: { type: String, default: null, trim: true },   // this is the freemius customer id not the suscription id.
    provider_subscription_id: { type: String, default: null, trim: true },  // suscription id from freemius
    // The Freemius license ID — the durable join key for every webhook event
    // after the very first one. Attribution to a User only ever needs email
    // once, at initial checkout (see app/api/billing/checkout/route.js); every
    // subsequent webhook (license.extended, license.plan.changed, ...)
    // matches by fs_license_id instead of re-parsing an email, so a later
    // email change/mismatch on the Freemius side can't orphan the update.
    fs_license_id: { type: String, default: null, trim: true, index: true },
    // What billing_plans quoted for this plan/billing_period combo at the
    // time this subscription was activated — lets anyone reading this
    // collection directly see what the user is paying without joining to
    // billing_plans. Not necessarily what Freemius actually charged if a
    // coupon/discount applied; it's the list price for the record.
    amount: { type: Number, default: null },
    currency: { type: String, default: "USD" },
    current_period_start: { type: Date, default: null },
    // The actual access gate. There is deliberately no cron job that sweeps
    // subscriptions and flips a status once this passes (see
    // getCurrentPlan()/getCurrentPlanAndPeriod() in lib/entitlements.js,
    // which is where real activity is computed) — matching how the Freemius
    // SDK's own EntitlementService.getActives() decides activity: a plain
    // expiration timestamp compared against `now` at read time, not a
    // separately-maintained status. Webhooks (license.expired/cancelled)
    // still update `status` below for support/billing-history visibility,
    // but nothing depends on that write actually happening or being timely.
    current_period_end: { type: Date, default: null },
    cancel_at_period_end: { type: Boolean, default: false },
    // Set only for status: "canceled" (an explicit cancellation).
    canceled_at: { type: Date, default: null },
    // Set only for status: "expired" (Freemius's license.expired webhook).
    // Informational only — see the current_period_end note above.
    expired_at: { type: Date, default: null },
    created_at: { type: Date, default: getKathmanduDateDefault },
    updated_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "subscriptions" },
);

subscriptionSchema.index({ user_id: 1, status: 1, created_at: -1 });
subscriptionSchema.index(
  { fs_license_id: 1 },
  { unique: true, partialFilterExpression: { fs_license_id: { $type: "string" } } },
);
subscriptionSchema.index(
  { provider_subscription_id: 1 },
  { unique: true, partialFilterExpression: { provider_subscription_id: { $type: "string" } } },
);

const billingPlanSchema = new Schema(
  {
    plan: { type: String, enum: ["pro", "unlimited"], required: true, unique: true },
    title: { type: String, required: true, trim: true },
    provider: { type: String, enum: ["freemius"], default: "freemius" },
    provider_product_id: { type: String, default: null, trim: true },
    provider_plan_id: { type: String, required: true, trim: true },
    monthly_price: { type: Number, required: true },
    yearly_price: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: getKathmanduDateDefault },
    updated_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "billing_plans" },
);

billingPlanSchema.index({ provider_plan_id: 1 }, { unique: true });

// Idempotency/replay guard for provider webhooks. A row here is created the
// first (and only) time a given provider event id is successfully accepted
// for processing — a duplicate delivery (Freemius retry) or a captured
// payload replayed by an attacker hits the unique index and is rejected
// before it can re-activate or extend a subscription. Kept indefinitely on
// purpose (no TTL): expiring old rows would eventually let a stale captured
// payload through again once its record aged out.
const webhookEventSchema = new Schema(
  {
    provider: { type: String, enum: ["freemius"], required: true },
    event_id: { type: String, required: true, trim: true },
    event_type: { type: String, default: null, trim: true },
    received_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "webhook_events" },
);

webhookEventSchema.index({ provider: 1, event_id: 1 }, { unique: true });

const feedbackSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
    created_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "feedback" },
);

feedbackSchema.index({ created_at: -1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
if (
  mongoose.models.ConnectedAccount &&
  (!mongoose.models.ConnectedAccount.schema.path("followers") ||
    !mongoose.models.ConnectedAccount.schema.path("page_id") ||
    mongoose.models.ConnectedAccount.schema.path("followers")?.defaultValue !== undefined)
) {
  mongoose.deleteModel("ConnectedAccount");
}

export const ConnectedAccount =
  mongoose.models.ConnectedAccount || mongoose.model("ConnectedAccount", connectedAccountSchema);
export const Preference = mongoose.models.Preference || mongoose.model("Preference", preferenceSchema);
if (mongoose.models.Post && !mongoose.models.Post.schema.path("source_ref")) {
  mongoose.deleteModel("Post");
}

export const Post = mongoose.models.Post || mongoose.model("Post", postSchema);
export const PostPlatform =
  mongoose.models.PostPlatform || mongoose.model("PostPlatform", postPlatformSchema);
export const AutoReplyRule =
  mongoose.models.AutoReplyRule || mongoose.model("AutoReplyRule", autoReplyRuleSchema);
export const AutoReplyLog =
  mongoose.models.AutoReplyLog || mongoose.model("AutoReplyLog", autoReplyLogSchema);
export const GithubEvent =
  mongoose.models.GithubEvent || mongoose.model("GithubEvent", githubEventSchema);
export const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
export const Analytics = mongoose.models.Analytics || mongoose.model("Analytics", analyticsSchema);
if (
  mongoose.models.InstagramDraft &&
  (!mongoose.models.InstagramDraft.schema.path("sender_name") ||
    !mongoose.models.InstagramDraft.schema.path("sender_profile_picture_url") ||
    !mongoose.models.InstagramDraft.schema.path("platform_comment_id") ||
    !mongoose.models.InstagramDraft.schema.path("sent_at") ||
    !mongoose.models.InstagramDraft.schema.path("platform_message_id") ||
    !mongoose.models.InstagramDraft.schema.path("confidence") ||
    !mongoose.models.InstagramDraft.schema.path("dm_template") ||
    !mongoose.models.InstagramDraft.schema.path("private_reply_sent_at"))
) {
  mongoose.deleteModel("InstagramDraft");
}

export const InstagramDraft =
  mongoose.models.InstagramDraft || mongoose.model("InstagramDraft", instagramDraftSchema);
export const AutoReplySettings =
  mongoose.models.AutoReplySettings || mongoose.model("AutoReplySettings", autoReplySettingsSchema);
export const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
export const Subscription =
  mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
export const BillingPlan =
  mongoose.models.BillingPlan || mongoose.model("BillingPlan", billingPlanSchema);
export const WebhookEvent =
  mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", webhookEventSchema);

const models = {
  User,
  ConnectedAccount,
  Preference,
  Post,
  PostPlatform,
  AutoReplyRule,
  AutoReplyLog,
  GithubEvent,
  ActivityLog,
  Analytics,
  InstagramDraft,
  AutoReplySettings,
  Feedback,
  Subscription,
  BillingPlan,
  WebhookEvent,
};

export default models;
