// Cloudinary client used to mirror Instagram profile pictures into our own
// storage. Meta's profile_picture_url / profile_pic values are short-lived,
// dynamic-CDN-hostname links (see components/dashboard/InstagramDraftInbox.tsx)
// that eventually 404 — uploading them to Cloudinary once and storing the
// resulting secure_url gives us a link that keeps working.
import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

// Configured on first use rather than at import: when the environment is
// loaded after this module (a script that calls dotenv, for instance), an
// import-time config call silently leaves the client without credentials, and
// every upload then fails with "Must supply api_key" — storing Meta's
// expiring CDN link instead of a permanent one.
let isConfigured = false;

function ensureCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) {
    return false;
  }

  if (!isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    isConfigured = true;
  }

  return true;
}

// Uploads a remote image URL to Cloudinary and returns the resulting
// secure_url, or null on any failure/misconfiguration. Cloudinary fetches
// the source URL itself server-side, so callers don't need to download it.
// `publicId` should be a stable per-entity id (e.g. the IG user id) so
// repeat uploads overwrite the same asset instead of accumulating storage.
export async function uploadProfilePictureFromUrl(sourceUrl, { publicId, folder }) {
  if (!sourceUrl || !ensureCloudinaryConfigured()) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      public_id: publicId,
      folder,
      overwrite: true,
      resource_type: "image",
      type: "upload",
    });

    return result?.secure_url || null;
  } catch (error) {
    console.error("Cloudinary profile picture upload failed:", error?.message || error);
    return null;
  }
}
