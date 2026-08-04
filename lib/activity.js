import { ActivityLog } from "./models.js";

export async function logActivity({ userId, type, platform, title, description, postId = null }) {
  try {
    await ActivityLog.create({
      user_id: userId,
      type,
      platform,
      title,
      description,
      post_id: postId,
    });
  } catch (error) {
    console.error("Failed to log activity:", type, error);
  }
}
