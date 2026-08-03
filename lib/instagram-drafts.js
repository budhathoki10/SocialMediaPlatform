// helper functions for managing Instagram drafts, updating draft status, and formatting draft data for display
import { buildRuleBasedDraft } from "./auto-reply-rules.js";
import { AutoReplyLog, ConnectedAccount, InstagramDraft } from "./models.js";

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
    confidence: Number.isFinite(draft.confidence) ? draft.confidence : null,
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
  const normalizedSenderUsername = normalizeUsername(
    senderUsername,
    senderId ? `user_${senderId}` : "instagram_user",
  );
  const senderProfileUrl = cleanText(senderProfilePictureUrl) || null;
  const normalizedSenderName = cleanText(senderName) || null;

  // Every configured rule (spam filtering, contact filters, keyword
  // exclusions, business hours, reply limits, tone/style, AI fallback for
  // anything unclear) always applies to draft generation, regardless of the
  // auto-post agent toggle. That toggle only decides whether a resulting
  // "ready" draft is sent automatically below, or waits for a human.
  const generatedDraft = await buildRuleBasedDraft({
    userId,
    message: originalMessage,
    senderId,
    senderName: normalizedSenderName,
    source,
  });

  console.log("Auto-reply rule result:", { userId: String(userId), senderId, reason: generatedDraft.reason });
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
        dm_template: generatedDraft.dmTemplate || null,
        confidence: Number.isFinite(generatedDraft.confidence) ? generatedDraft.confidence : null,
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

  // **********************************A kind of agent but it is just a simple agent that checks if the draft is ready and pending and if the user has enabled the auto-post agent and has the Instagram platform access enabled, then it will send the draft automatically. Otherwise, it will leave the draft for manual review.**********************************
  // _+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+_+

  // Auto-post agent: only sends drafts that are still pending and were judged
  // "ready" (never needs_review/blocked), and only when the account owner has
  // both the agent and Instagram platform access turned on. Everything else
  // is left exactly as-is for a human to review, same as today.
  const settings = generatedDraft.settings || {};
  const autoSendEligible =
    Boolean(settings.enabled) &&   // auto post agent is enabled by the user
    Boolean(settings.platform_permissions?.instagram) &&   // here is all the eligibility checks for auto-send, if any of these is false then the draft will not be sent automatically and will be left for manual review
  // for auto send it first check if enable then also check if the instagram is ok or not and then check if the draft is ready and pending, if all these are true then it will be sent automatically
    draft.tone === "ready" &&
    draft.status === "pending";

  if (autoSendEligible) {
    try {
      const sendResult = await approveInstagramDraft({ userId, draftId: draft._id });

      if (sendResult.ok) {
        draft.status = "sent";
        draft.sent_at = sendResult.draft?.sentAt || new Date();

        await AutoReplyLog.create({
          user_id: userId,
          platform: "instagram",
          sender_name: draft.sender_name,
          sender_username: draft.sender_username,
          sender_profile_picture_url: draft.sender_profile_picture_url,
          original_comment: draft.original_message,
          reply_sent: draft.draft_reply,
        });
      } else {
        console.warn("Auto-reply agent could not send draft, leaving it pending for manual review:", sendResult.error);
      }
    } catch (error) {
      console.error("Auto-reply agent failed to send draft, leaving it pending for manual review:", error);
    }
  }

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

// Sends the optional keyword-rule DM tied to a comment, via Meta's Private
// Reply API — the same messages endpoint a real DM uses, but the recipient
// is {comment_id} instead of {id}. Meta allows only one private reply per
// comment ever, and only within a limited window after it was posted, so
// failures here are logged and swallowed rather than surfaced: the public
// comment reply already succeeded by the time this runs and shouldn't be
// reported as a failed send just because the DM half couldn't go out.
async function sendInstagramPrivateReply({ account, commentId, message }) {
  try {
    // Native Instagram Login sends through the connected IG account's own token via
    // graph.instagram.com/me — no Facebook Page ID involved, unlike the old flow.
    const response = await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn("Instagram private reply failed (comment reply was still sent):", result);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Instagram private reply request failed (comment reply was still sent):", error);
    return false;
  }
}

// Sends one draft's reply through the Instagram Graph API (native Instagram Login) and
// marks it "sent". Shared by the single-draft approve route and the bulk approve route so
// both send through the exact same Graph API call and status transition.
export async function approveInstagramDraft({ userId, draftId }) {
  const draft = await InstagramDraft.findOne({
    _id: draftId,
    user_id: userId,
    status: "pending",
  });

  if (!draft) {
    return { ok: false, status: 404, error: "Pending draft not found." };
  }

  if (!draft.draft_reply?.trim()) {
    return { ok: false, status: 400, error: "Draft reply is empty." };
  }

  const account = await ConnectedAccount.findOne({
    user_id: userId,
    platform: "instagram",
    status: "active",
  }).select("+access_token");

  if (!account?.access_token) {
    return { ok: false, status: 404, error: "Connected Instagram account not found." };
  }

  const isCommentReply = draft.source === "comment";

  if (!isCommentReply && !draft.sender_id) {
    return { ok: false, status: 400, error: "Instagram recipient ID is missing." };
  }

  const replyText = draft.draft_reply.trim();
  const savedCommentId = draft.platform_comment_id || draft.external_id?.split(":")[1] || null;

  if (isCommentReply && !savedCommentId) {
    return { ok: false, status: 400, error: "Instagram comment ID is missing." };
  }

  // Native Instagram Login: DMs go through the connected account's own token via
  // graph.instagram.com/me/messages — no Facebook Page ID involved, unlike the old flow.
  const instagramResponse = await fetch(
    isCommentReply
      ? `https://graph.instagram.com/v21.0/${savedCommentId}/replies`
      : `https://graph.instagram.com/v21.0/me/messages`,
    isCommentReply
      ? {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ message: replyText, access_token: account.access_token }),
        }
      : {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: { id: draft.sender_id },
            message: { text: replyText },
          }),
        },
  );

  const instagramResult = await instagramResponse.json().catch(() => ({}));

  if (!instagramResponse.ok) {
    console.error("Instagram reply failed:", instagramResult);

    return {
      ok: false,
      status: instagramResponse.status,
      error: instagramResult?.error?.message || "Instagram rejected the reply.",
    };
  }

  draft.status = "sent";
  draft.connected_account_id = account._id;
  draft.sent_at = new Date();
  draft.platform_message_id = instagramResult.id || instagramResult.message_id || null;
  draft.updated_at = new Date();
  await draft.save();

  // Optional: the matched keyword rule also configured a DM. Send it as an
  // Instagram private reply now that the public comment reply is confirmed.
  if (isCommentReply && draft.dm_template?.trim() && !draft.private_reply_sent_at) {
    const privateReplySent = await sendInstagramPrivateReply({
      account,
      commentId: savedCommentId,
      message: draft.dm_template.trim(),
    });

    if (privateReplySent) {
      draft.private_reply_sent_at = new Date();
      await draft.save();
    }
  }

  return {
    ok: true,
    draft: {
      id: draft._id.toString(),
      status: draft.status,
      platformMessageId: draft.platform_message_id,
      sentAt: draft.sent_at,
    },
  };
}

// Marks one pending draft as rejected. Shared by the single-draft reject route
// and the bulk reject route.
export async function rejectInstagramDraft({ userId, draftId }) {
  const draft = await InstagramDraft.findOne({
    _id: draftId,
    user_id: userId,
    status: "pending",
  });

  if (!draft) {
    return { ok: false, status: 404, error: "Pending draft not found." };
  }

  draft.status = "rejected";
  draft.updated_at = new Date();
  await draft.save();

  return {
    ok: true,
    draft: {
      id: draft._id.toString(),
      status: draft.status,
    },
  };
}
