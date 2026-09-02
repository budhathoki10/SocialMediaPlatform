import {Queue} from "bullmq";
import {redisConnection} from "./bullmqredis.js";

// Job data in Redis (separate from the 10-day Post retention in MongoDB) is
// kept only briefly to limit Redis footprint/request volume.
export const QUEUE_JOB_RETENTION_SECONDS = 15 * 60;

export const myQueue = new Queue("my-queue", {
    
  connection: redisConnection,
  // Upstash's connection user can't run INFO, which BullMQ otherwise calls
  // on every (re)connect to detect the Redis version — skip that check.
  skipVersionCheck: true,
  defaultJobOptions: {
        removeOnComplete: { age: QUEUE_JOB_RETENTION_SECONDS }, // 15 minutes
        removeOnFail: { age: QUEUE_JOB_RETENTION_SECONDS }, // 15 minutes
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
    }

});
// i am just testing it 
