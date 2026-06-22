import {Queue} from "bullmq";
import {redisConnection} from "./bullmqredis";

export const myQueue = new Queue("my-queue", {
  connection: redisConnection,
  defaultJobOptions: {
        removeOnComplete: { age: 24 * 60 * 60 }, // 1 day
        removeOnFail: { age: 1 * 24 * 60 * 60 }, // 1 day
    }
});
