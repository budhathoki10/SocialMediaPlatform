// Looks up the profile behind an Instagram sender id. This runs from the
// queued draft job rather than the webhook itself: it costs a Graph round trip
// plus a Cloudinary upload, which together are far more than Meta's delivery
// timeout allows.
import { uploadProfilePictureFromUrl } from "./cloudinary.js";
import { ConnectedAccount } from "./models.js";

/** Fetches name/username/avatar for a sender, trying each supplied token in
 * turn. Returns null instead of throwing when nothing works — a draft without
 * profile details is still a usable draft. */
export async function getInstagramSenderProfile(senderId, accessTokens) {
  const tokens = [...new Set((accessTokens || []).filter(Boolean))];

  if (!senderId || tokens.length === 0) {
    return null;
  }

  for (const accessToken of tokens) {
    try {
      const profileUrl = new URL(`https://graph.instagram.com/v25.0/${senderId}`);
      profileUrl.searchParams.set("fields", "name,username,profile_pic");
      profileUrl.searchParams.set("access_token", accessToken);

      const response = await fetch(profileUrl, {
        cache: "no-store", // do not cache the response, always get the latest data from Instagram
        signal: AbortSignal.timeout(5_000), // cancel the request if it takes more than 5 seconds
      });

      const profile = await response.json();

      if (response.ok) {
        // Mirror Meta's short-lived profile_pic CDN link into Cloudinary so it
        // doesn't rot in the drafts inbox; public_id is the stable sender id
        // so repeat events overwrite the same asset. Falls back to Meta's own
        // URL if Cloudinary isn't configured or the upload fails.
        const cloudinaryProfilePictureUrl = await uploadProfilePictureFromUrl(profile?.profile_pic, {
          publicId: senderId,
          folder: "AutoPilot/instagram/senders",
        });

        return {
          name: profile?.name || profile?.username || null,
          username: profile?.username || profile?.name || null,
          profilePictureUrl: cloudinaryProfilePictureUrl || profile?.profile_pic || null,
        };
      }
    } catch {
      // Try the next configured token without failing the caller.
    }
  }

  console.warn("Unable to load Instagram sender profile.", { senderId });
  return null;
}

/** Convenience wrapper for the queued job, which only knows the account id. */
export async function getSenderProfileForAccount(connectedAccountId, senderId) {
  if (!senderId) {
    return null;
  }

  const account = connectedAccountId
    ? await ConnectedAccount.findById(connectedAccountId).select("+access_token").lean()
    : null;

  return getInstagramSenderProfile(senderId, [account?.access_token, process.env.INSTAGRAM_REPLIED_ACCESSTOKEN]);
}
