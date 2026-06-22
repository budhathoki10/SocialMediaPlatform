import { Post } from "./models.js";
import { POST_RETENTION_MS } from "./post-retention-config.js";
import { myQueue } from "./queue.js";

export async function initializePostRetention() {
  await Post.collection.createIndex(
    { expires_at: 1 },
    { expireAfterSeconds: 0, name: "post_expiration_ttl" },
  );

  await Post.collection.updateMany(
    { expires_at: { $exists: false } },
    [{ $set: { expires_at: { $add: ["$created_at", POST_RETENTION_MS] } } }],
  );
}

export async function cleanExpiredQueueJobs() {
  await Promise.all([
    myQueue.clean(POST_RETENTION_MS, 1_000, "completed"),
    myQueue.clean(POST_RETENTION_MS, 1_000, "failed"),
  ]);
}
