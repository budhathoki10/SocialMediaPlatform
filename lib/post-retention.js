import { Post } from "./models.js";
import { POST_RETENTION_MS } from "./post-retention-config.js";
import { myQueue, QUEUE_JOB_RETENTION_SECONDS } from "./queue.js";

// An older schema kept a 24h TTL on `created_at` for draft posts. Mongo never
// drops an index just because the code stopped declaring one, so it stayed
// live and silently deleted every generated draft a day after it was created —
// `expires_at`/`post_expiration_ttl` below is the only retention rule we want.
const RETIRED_POST_INDEXES = ["created_at_1"];

async function dropRetiredPostIndexes() {
  for (const indexName of RETIRED_POST_INDEXES) {
    try {
      await Post.collection.dropIndex(indexName);
      console.log(`Dropped retired posts index: ${indexName}`);
    } catch (error) {
      // IndexNotFound (27) is the normal case on every run after the first.
      if (error?.code !== 27 && !/index not found/i.test(error?.message || "")) {
        throw error;
      }
    }
  }
}

export async function initializePostRetention() {
  await dropRetiredPostIndexes();

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
  const retentionMs = QUEUE_JOB_RETENTION_SECONDS * 1000;

  await Promise.all([
    myQueue.clean(retentionMs, 1_000, "completed"),
    myQueue.clean(retentionMs, 1_000, "failed"),
  ]);
}
