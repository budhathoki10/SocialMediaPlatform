import { Worker } from "bullmq";
import mongoose from "mongoose";

import { redisConnection } from "./bullmqredis.js";
import { connectDB } from "./db.js";
import { GithubEvent, Post } from "./models.js";
import { generatePost } from "./postgenerator.js";

const globalWorker = globalThis;

async function processPostJob(job) {
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
    created_at: new Date(),
  });

  await GithubEvent.create({
    user_id: userObjectId,
    repo_name: repo,
    event_type: type,
    post_id: post._id,
    created_at: new Date(),
  });

  await job.updateProgress(100);
  console.log("GitHub post draft saved:", post._id.toString());

  return { postId: post._id.toString() };
}

export function startPostWorker() {
  if (globalWorker.githubPostWorker) {
    return globalWorker.githubPostWorker;
  }

  const worker = new Worker("my-queue", processPostJob, { connection: redisConnection });

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

export async function stopPostWorker() {
  if (!globalWorker.githubPostWorker) {
    return;
  }

  await globalWorker.githubPostWorker.close();
  globalWorker.githubPostWorker = null;
}