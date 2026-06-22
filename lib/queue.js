import {Queue} from "bullmq";
import {redisConnection} from "./bullmqredis.js";

export const myQueue = new Queue("my-queue", {
  connection: redisConnection,
  defaultJobOptions: {
        removeOnComplete: { age: 10*24 * 60 * 60 }, // 10 days
        removeOnFail: { age: 10 * 24 * 60 * 60 }, // 10 days
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
    }
});
