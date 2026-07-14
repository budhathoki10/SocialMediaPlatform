// helper functions for managing Instagram drafts, updating draft status, and formatting draft data for display
import { InstagramDraft } from "./models.js";

function cleanText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function normalizeDraftReply(value) {
  return cleanText(value);
}

function normalizeUsername(value, fallback = "instagram_user") {
  const username = cleanText(value, fallback).replace(/^@/, "");
  return username || fallback;
}

function getToneFromMessage(message) {
  const lowerMessage = message.toLowerCase();

  if (/(free crypto|giveaway|buy followers|instant delivery|promo)/i.test(lowerMessage)) {
    return {
      tone: "blocked",
      confidence: 12,
      draftReply: "Draft suppressed - suspicious promotion detected.",
    };
  }

  if (/(price|pricing|cost|link|join|how do i|help)/i.test(lowerMessage)) {
    return {
      tone: "ready",
      confidence: 94,
      draftReply: "Thanks for reaching out! We can help with that. Please share a little more detail so we can guide you properly.",
    };
  }

  return {
    tone: "needs_review",
    confidence: 82,
    draftReply: "Thanks for reaching out! We can help with that. Please share a little more detail so we can guide you properly.",
  };
}

export function formatInstagramDraft(draft) {
  const username = normalizeUsername(draft.sender_username);

  return {
    id: draft._id?.toString?.() || String(draft._id),
    externalId: draft.external_id,
    name: cleanText(draft.sender_name, username),
    username: `@${username}`,
    profilePictureUrl: draft.sender_profile_picture_url || null,
    source: draft.source === "comment" ? "Comment" : "DM",
    message: draft.original_message,
    draft: draft.draft_reply,
    confidence: `${draft.confidence || 0}%`,
    tone: draft.tone === "blocked" ? "bad" : "good",
    status: draft.status,
    createdAt: draft.created_at?.toISOString?.() || draft.created_at || null,
    sentAt: draft.sent_at?.toISOString?.() || draft.sent_at || null,
  };
}

export async function upsertInstagramDraft({
  userId,
  connectedAccountId,
  platformUserId,
  externalId,
  source,
  platformCommentId,
  senderId,
  senderName,
  senderUsername,
  senderProfilePictureUrl,
  message,
}) {
  const originalMessage = cleanText(message, "Instagram event received.");
  const generatedDraft = getToneFromMessage(originalMessage);
  const normalizedSenderUsername = normalizeUsername(
    senderUsername,
    senderId ? `user_${senderId}` : "instagram_user",
  );
  const senderProfileUrl = cleanText(senderProfilePictureUrl) || null;
  const normalizedSenderName = cleanText(senderName) || null;
  const senderProfileUpdates = {};

  if (normalizedSenderName) {
    senderProfileUpdates.sender_name = normalizedSenderName;
  }

  if (normalizedSenderUsername && normalizedSenderUsername !== senderId) {
    senderProfileUpdates.sender_username = normalizedSenderUsername;
  }

  if (senderProfileUrl) {
    senderProfileUpdates.sender_profile_picture_url = senderProfileUrl;
  }

  const draft = await InstagramDraft.findOneAndUpdate(
    {
      user_id: userId,
      external_id: externalId,
    },
    {
      $setOnInsert: {
        user_id: userId,
        connected_account_id: connectedAccountId || null,
        platform_user_id: platformUserId || null,
        external_id: externalId,
        source,
        sender_id: senderId || null,
        original_message: originalMessage,
        draft_reply: generatedDraft.draftReply,
        confidence: generatedDraft.confidence,
        tone: generatedDraft.tone,
        status: "pending",
        created_at: new Date(),
      },
      $set: {
        ...senderProfileUpdates,
        platform_comment_id: platformCommentId || null,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after", upsert: true, runValidators: true },
  ).lean();

  return formatInstagramDraft(draft);
}

// Meta can send our own published comment reply back through the webhook.
// Match that reply to its original draft instead of creating a new pending row.
export async function markInstagramReplySent({ userId, platformReplyId, parentCommentId }) {
  const correlations = [];

  if (platformReplyId) {
    correlations.push({ platform_message_id: platformReplyId });
  }

  if (parentCommentId) {
    correlations.push({ platform_comment_id: parentCommentId });
  }

  if (correlations.length === 0) {
    return null;
  }

  const sentAt = new Date();
  const update = {
    $set: {
      status: "sent",
      sent_at: sentAt,
      updated_at: sentAt,
      ...(platformReplyId ? { platform_message_id: platformReplyId } : {}),
    },
  };

  const originalDraft = await InstagramDraft.findOneAndUpdate(
    { user_id: userId, $or: correlations },
    update,
    { returnDocument: "after" },
  ).lean();

  // Also repair any earlier webhook row that was accidentally saved as a
  // pending draft for this outgoing comment reply.
  if (platformReplyId) {
    await InstagramDraft.updateMany(
      {
        user_id: userId,
        source: "comment",
        platform_comment_id: platformReplyId,
      },
      update,
    );
  }

  return originalDraft ? formatInstagramDraft(originalDraft) : null;
}
