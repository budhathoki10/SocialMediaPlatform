// this is the webhook where instagram sends the events when a user sends a message or comments on a post. This webhook will receive the events and create a draft in the database for the user to reply to.
import { connectDB } from "@/lib/db";
import { markInstagramReplySent, recordInstagramInboundEvent } from "@/lib/instagram-drafts";
import { ConnectedAccount } from "@/lib/models";
import { myQueue } from "@/lib/queue";

export const dynamic = "force-dynamic";

function getValueText(value) {
  return value?.text || value?.message || value?.comment || "";
}

function getSenderUsername(sender) {
  return sender?.username || sender?.name || sender?.id || "instagram_user";
}
// This function creates one unique text ID by joining a prefix and several values with colons:
/*
for example createExternalId("dm", "user123", "message456");
then it will return "dm:user123:message456"

*/
function createExternalId(prefix, ...parts) {
  return [prefix, ...parts.filter(Boolean)].join(":");
}

// it extracts the dm and comments event from the Instagram webhook body and returns an array of events with the following structure:
function extractDraftEvents(body) {
  const events = [];

  for (const entry of body?.entry || []) {
    const platformCandidates = new Set([entry?.id].filter(Boolean));

    for (const messageEvent of entry?.messaging || []) {
      const message = messageEvent?.message;

      // Meta echoes messages sent by the connected Instagram account. They are
      // already recorded as sent after approval and must not become new drafts.
      if (message?.is_echo) {
        continue;
      }

      const text = message?.text || message?.quick_reply?.payload || "";

      if (!text) {
        continue;
      }

      if (messageEvent?.recipient?.id) {
        platformCandidates.add(messageEvent.recipient.id);
      }

      events.push({
        platformCandidates: [...platformCandidates],
        source: "dm",
        externalId: createExternalId("instagram-dm", message?.mid, messageEvent?.sender?.id, messageEvent?.timestamp),
        senderId: messageEvent?.sender?.id || null,
        senderUsername: getSenderUsername(messageEvent?.sender),
        message: text,
      });
    }

    for (const change of entry?.changes || []) {
      const value = change?.value || {};
      const text = getValueText(value);

      if (!text) {
        continue;
      }

      if (value?.recipient_id) {
        platformCandidates.add(value.recipient_id);
      }

      if (value?.media?.owner?.id) {
        platformCandidates.add(value.media.owner.id);
      }

      const isComment = change?.field?.includes("comment") || value?.comment_id || value?.from;
      const platformCommentId = isComment ? value?.id || value?.comment_id || null : null;
      const parentCommentId = isComment ? value?.parent_id || value?.parent_comment_id || null : null;

      events.push({
        platformCandidates: [...platformCandidates],
        source: isComment ? "comment" : "dm",
        platformCommentId,
        parentCommentId,
        externalId: createExternalId(
          isComment ? "instagram-comment" : "instagram-event",
          value?.id || value?.comment_id,
          value?.from?.id,
          value?.created_time,
          text.slice(0, 32),
        ),
        senderId: value?.from?.id || value?.sender?.id || null,
        senderUsername: getSenderUsername(value?.from || value?.sender),
        message: text,
      });
    }
  }

  return events;
}

async function findInstagramAccount(platformCandidates) {
  const query = {
    platform: "instagram",
    status: "active",
  };

  if (platformCandidates.length > 0) {
    query.platform_user_id = { $in: platformCandidates };
  }

  const matchedAccount = await ConnectedAccount.findOne(query)
    .select("_id user_id platform_user_id +access_token")
    .lean();

  if (matchedAccount) {
    return matchedAccount;
  }

  return null;
}

//This GET handler is used by Instagram/Meta to verify that your webhook endpoint belongs to you
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("Instagram webhook verification request:", {
    mode,
    token,
    challenge,
    envToken: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
  });

  if (
    mode === "subscribe" && // if it is true then it is a verification request from Instagram
    token && // if it is true then the token is provided in the request
    challenge && // if it is true then the challenge is provided in the request
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN && // if it is true then the verify token is set in the environment variable
    token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();
 console.log("Mesiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii")
    console.log("Instagram webhook event received:");
    console.log(JSON.stringify(body, null, 2));

    await connectDB();

    const webhookEvents = extractDraftEvents(body);

    for (const webhookEvent of webhookEvents) {
      const account = await findInstagramAccount(webhookEvent.platformCandidates);

      if (!account) {
        console.warn("Instagram webhook event skipped because no connected account matched.", {
          platformCandidates: webhookEvent.platformCandidates,
          source: webhookEvent.source,
        });
        continue;
      }

      // check if the comment is sent by the connected account itself, if yes then mark the comment as sent and do not create a draft for it. This is to avoid creating a draft for the comments that are sent by the connected account itself.
      const isOutgoingCommentReply =
        webhookEvent.source === "comment" &&
        webhookEvent.senderId &&
        String(webhookEvent.senderId) === String(account.platform_user_id);

      if (isOutgoingCommentReply) {
        await markInstagramReplySent({
          userId: account.user_id,
          platformReplyId: webhookEvent.platformCommentId,
          parentCommentId: webhookEvent.parentCommentId,
        });
        continue;
      }

      // Record the message and hand the slow work (sender profile lookup and
      // the model call) to the queue. Composing a reply inline took longer than
      // Meta waits for a 200, so the function was killed before the draft was
      // ever written and every event was lost.
      const { draftId, needsReply } = await recordInstagramInboundEvent({
        userId: account.user_id,
        connectedAccountId: account._id,
        platformUserId: account.platform_user_id,
        externalId: webhookEvent.externalId,
        source: webhookEvent.source,
        platformCommentId: webhookEvent.platformCommentId,
        senderId: webhookEvent.senderId,
        senderUsername: webhookEvent.senderUsername,
        message: webhookEvent.message,
      });

      // Queue whenever the row still has no reply, not just on first sight:
      // if a previous delivery recorded the message but failed before it could
      // queue, Meta's retry is the only chance to recover it. The job id makes
      // a repeat add a no-op, so this can't produce duplicate work.
      if (!needsReply) {
        continue;
      }

      await myQueue.add(
        "instagramReply",
        {
          type: "instagram_reply",
          userId: account.user_id.toString(),
          connectedAccountId: account._id.toString(),
          draftId: draftId.toString(),
          senderId: webhookEvent.senderId,
        },
        // BullMQ namespaces its Redis keys with ":" and rejects a custom job id
        // containing one, so this separator must stay a dash.
        { jobId: `ig-reply-${draftId}` },
      );
    }

    return new Response("EVENT_RECEIVED", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Instagram webhook POST error:", error);

    return new Response("Webhook error", {
      status: 500,
    });
  }
}   
