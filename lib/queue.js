import {Queue} from "bullmq";
import {redisConnection} from "./bullmqredis";

export const myQueue = new Queue("my-queue", {
  connection: redisConnection,
});
