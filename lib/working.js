import { Worker } from "bullmq";
import mongoose from "mongoose";

import { logActivity } from "./activity.js";
import { redisConnection } from "./bullmqredis.js";
import { connectDB } from "./db.js";
import { finalizeInstagramDraftReply, findStuckInstagramDrafts } from "./instagram-drafts.js";
import { getSenderProfileForAccount } from "./instagram-sender-profile.js";
import { GithubEvent, Post, getKathmanduDate } from "./models.js";
import { generatePost } from "./postgenerator.js";
import { myQueue } from "./queue.js";

const globalWorker = globalThis;

/** Composes the reply for an Instagram draft the webhook already recorded. */
async function processInstagramReplyJob(job) {
  const { userId, connectedAccountId, draftId, senderId } = job.data;

  if (!userId || !mongoose.isValidObjectId(userId) || !draftId) {
    throw new Error("Instagram reply job is missing a valid userId or draftId.");
  }

  console.log("Processing Instagram reply job:", job.id, { draftId, userId });
  await connectDB();
  await job.updateProgress(20);

  const senderProfile = await getSenderProfileForAccount(connectedAccountId, senderId);
  await job.updateProgress(50);

  const draft = await finalizeInstagramDraftReply({
    userId: new mongoose.Types.ObjectId(userId),
    draftId,
    senderProfile,
  });

  await job.updateProgress(100);
  console.log("Instagram draft reply composed:", draftId);

  return { draftId, status: draft?.status || "unchanged" };
}

export async function processPostJob(job) {
  // The queue carries both GitHub post generation and Instagram reply drafting.
  if (job.name === "instagramReply" || job.data?.type === "instagram_reply") {
    return processInstagramReplyJob(job);
  }

  const { repo, type, prTitle, prBody, commits, userId } = job.data;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new Error("GitHub post job is missing a valid userId.");
  }

  console.log("Processing GitHub post job:", job.id, { repo, type, userId });
  await job.updateProgress(20);

  const draft = await generatePost({ repo, type, prTitle, prBody, commits });
  await job.updateProgress(65);

  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const post = await Post.create({
    user_id: userObjectId,
    content: draft,
    pr_title: prTitle || null,
    pr_body: prBody || null,
    status: "draft",
    source: "github_event",
    created_at: getKathmanduDate(),
  });

  await GithubEvent.create({
    user_id: userObjectId,
    repo_name: repo,
    event_type: type,
    post_id: post._id,
    created_at: getKathmanduDate(),
  });

  await logActivity({
    userId: userObjectId,
    type: "draft_generated",
    platform: "github",
    title: "AI Agent generated a draft post",
    description: `New draft created from ${repo}.`,
    postId: post._id,
  });

  await job.updateProgress(100);
  console.log("GitHub post draft saved:", post._id.toString());

  return { postId: post._id.toString() };
}

export function startPostWorker() {
  if (globalWorker.githubPostWorker) {
    return globalWorker.githubPostWorker;
  }

  // skipVersionCheck: Upstash's connection user can't run INFO, which BullMQ
  // otherwise calls on every (re)connect to detect the Redis version.
  const worker = new Worker("my-queue", processPostJob, { connection: redisConnection, skipVersionCheck: true });

  worker.on("completed", (job, result) => {
    console.log("GitHub post job completed:", job.id, result);
  });

  worker.on("failed", (job, error) => {
    console.error("GitHub post job failed:", job?.id, error);
  });

  worker.on("error", (error) => {
    console.error("GitHub post worker error:", error);
  });

  globalWorker.githubPostWorker = worker;
  console.log("GitHub post worker is listening for BullMQ jobs.");

  return worker;
}

/**
 * Re-queues Instagram drafts that were recorded but never got their reply.
 * The webhook is the only thing that normally enqueues that work, so if it
 * writes the row and then fails before the job is added, nothing else would
 * ever pick it up and the draft sits at the placeholder permanently.
 *
 * Job ids are derived from the draft id, so a draft that already has a live
 * job queued is a no-op here.
 */
export async function requeueStuckInstagramDrafts({ limit = 10 } = {}) {
  await connectDB();
  const stuck = await findStuckInstagramDrafts({ limit });
  let requeued = 0;

  for (const draft of stuck) {
    const jobId = `ig-reply-${draft._id}`;
    const existing = await myQueue.getJob(jobId);

    if (existing) {
      const state = await existing.getState();

      // Still queued or running: leave it alone, it will be picked up.
      if (state === "waiting" || state === "active" || state === "delayed") {
        continue;
      }

      // Finished (typically failed after stalling when the function was torn
      // down mid-job). BullMQ dedupes on job id, so adding again would be a
      // silent no-op until retention expires — the job has to go first.
      await existing.remove();
    }

    await myQueue.add(
      "instagramReply",
      {
        type: "instagram_reply",
        userId: draft.user_id.toString(),
        connectedAccountId: draft.connected_account_id?.toString() || null,
        draftId: draft._id.toString(),
        senderId: draft.sender_id,
      },
      { jobId },
    );
    requeued += 1;
  }

  if (requeued > 0) {
    console.log(`Re-queued ${requeued} Instagram draft(s) with no composed reply.`);
  }

  return requeued;
}

export async function processQueuedPostJobs({ maxRuntimeMs = 45_000 } = {}) {
  const completed = [];
  const failed = [];
  const worker = new Worker("my-queue", processPostJob, {
    autorun: false,
    concurrency: 1,
    connection: redisConnection,
    skipVersionCheck: true,
    // This worker lives inside a serverless invocation that can be frozen or
    // torn down mid-job, which drops the job's lock and stalls it. The default
    // maxStalledCount of 1 turns that straight into "job stalled more than
    // allowable limit" and a permanent failure, so allow it to be re-attempted.
    maxStalledCount: 3,
  });

  worker.on("completed", (job, result) => {
    completed.push({ jobId: job.id, result });
    console.log("GitHub post cron job completed:", job.id, result);
  });

  worker.on("failed", (job, error) => {
    failed.push({ jobId: job?.id || null, error: error.message });
    console.error("GitHub post cron job failed:", job?.id, error);
  });

  worker.on("error", (error) => {
    failed.push({ jobId: null, error: error.message });
    console.error("GitHub post cron worker error:", error);
  });

  const drained = new Promise((resolve) => {
    worker.once("drained", () => resolve("drained"));
  });
  const timedOut = new Promise((resolve) => {
    setTimeout(() => resolve("timeout"), maxRuntimeMs);
  });

  const workerRun = worker.run();
  const stopReason = await Promise.race([drained, timedOut]);

  await worker.close();
  await workerRun.catch(() => null);

  return {
    stopReason,
    completed,
    failed,
    completedCount: completed.length,
    failedCount: failed.length,
  };
}

export async function stopPostWorker() {
  if (!globalWorker.githubPostWorker) {
    return;
  }

  await globalWorker.githubPostWorker.close();
  globalWorker.githubPostWorker = null;
}
