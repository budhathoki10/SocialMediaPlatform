// this is the webhook where instagram sends the events when a user sends a message or comments on a post. This webhook will receive the events and create a draft in the database for the user to reply to.
import { connectDB } from "@/lib/db";
import { upsertInstagramDraft } from "@/lib/instagram-drafts";
import { ConnectedAccount } from "@/lib/models";

export const dynamic = "force-dynamic";

function getValueText(value) {
  return value?.text || value?.message || value?.comment || "";
}

function getSenderUsername(sender) {
  return sender?.username || sender?.name || sender?.id || "instagram_user";
}

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

      events.push({
        platformCandidates: [...platformCandidates],
        source: isComment ? "comment" : "dm",
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

// fetch the user name, photo and other details of the sender from the Instagram Graph API using the senderId and the access token of the connected account. If the senderId is not provided or the access token is not valid, return null.
async function getInstagramSenderProfile(senderId, accessTokens) {
  const tokens = [...new Set(accessTokens.filter(Boolean))];

  if (!senderId || tokens.length === 0) {
    return null;
  }

  for (const accessToken of tokens) {
    try {
      const profileUrl = new URL(`https://graph.instagram.com/v25.0/${senderId}`);
      profileUrl.searchParams.set("fields", "name,username,profile_pic");
      profileUrl.searchParams.set("access_token", accessToken);

      const response = await fetch(profileUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });

      const profile = await response.json();

      if (response.ok) {
        return {
          name: profile?.name || profile?.username || null,
          username: profile?.username || profile?.name || null,
          profilePictureUrl: profile?.profile_pic || null,
        };
      }
    } catch {
      // Try the next configured token without failing the webhook.
    }
  }

  console.warn("Unable to load Instagram sender profile.", { senderId });
  return null;
}

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
    mode === "subscribe" &&
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

      const senderProfile = await getInstagramSenderProfile(
        webhookEvent.senderId,
        [account.access_token, process.env.INSTAGRAM_REPLIED_ACCESSTOKEN],
      );

      await upsertInstagramDraft({
        userId: account.user_id,
        connectedAccountId: account._id,
        platformUserId: account.platform_user_id,
        externalId: webhookEvent.externalId,
        source: webhookEvent.source,
        senderId: webhookEvent.senderId,
        senderName: senderProfile?.name || null,
        senderUsername: senderProfile?.username || webhookEvent.senderUsername,
        senderProfilePictureUrl: senderProfile?.profilePictureUrl || null,
        message: webhookEvent.message,
      });
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
