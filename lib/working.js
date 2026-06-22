import {Worker} from "bullmq"
import {redisConnection} from "./bullmqredis";
import {generatePost} from "./postgenerator";
import { Post, GithubEvent } from "./models";
import mongoose from "mongoose";
import { connectDB } from "./db";

const worker = new Worker("my-queue", async (job) => {
        const { repo, type, prTitle, prBody, userId } = job.data;
     console.log("Processing job:", job.id, job.data);

    const draft = await generatePost(job.data);
    
await connectDB();
    const post = await Post.create({
      user_id: new mongoose.Types.ObjectId(userId),
      content: draft,
      status: "draft",
      source: "github_event",
      created_at: new Date(),
    });

    await GithubEvent.create({
      user_id: new mongoose.Types.ObjectId(userId),
      repo_name: repo,
      event_type: type,
      post_id: post._id,
      created_at: new Date(),
    });

    console.log("Draft saved! Post ID:", post._id);




},
{connection: redisConnection}

)


