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

const platformValues = [
  "x",
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
  "threads",
  "github",
  "youtube",
  "tiktok",
];

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    avatar_url: { type: String, default: null },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
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
    platform_username: { type: String, required: true, trim: true },
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
    created_at: { type: Date, default: getKathmanduDateDefault },
  },
  { collection: "auto_reply_rules" },
);

autoReplyRuleSchema.index({ user_id: 1, keyword: 1 }, { unique: true });

const autoReplyLogSchema = new Schema(
  {
    user_id: { type: objectId, ref: "User", required: true, index: true },
    platform: { type: String, enum: platformValues, required: true },
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

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const ConnectedAccount =
  mongoose.models.ConnectedAccount || mongoose.model("ConnectedAccount", connectedAccountSchema);
export const Preference = mongoose.models.Preference || mongoose.model("Preference", preferenceSchema);
export const Post = mongoose.models.Post || mongoose.model("Post", postSchema);
export const PostPlatform =
  mongoose.models.PostPlatform || mongoose.model("PostPlatform", postPlatformSchema);
export const AutoReplyRule =
  mongoose.models.AutoReplyRule || mongoose.model("AutoReplyRule", autoReplyRuleSchema);
export const AutoReplyLog =
  mongoose.models.AutoReplyLog || mongoose.model("AutoReplyLog", autoReplyLogSchema);
export const GithubEvent =
  mongoose.models.GithubEvent || mongoose.model("GithubEvent", githubEventSchema);
export const Analytics = mongoose.models.Analytics || mongoose.model("Analytics", analyticsSchema);

const models = {
  User,
  ConnectedAccount,
  Preference,
  Post,
  PostPlatform,
  AutoReplyRule,
  AutoReplyLog,
  GithubEvent,
  Analytics,
};

export default models;
