// Standalone BullMQ worker entrypoint — no Express/Next.js involved. This is
// what runs as its own Render Background Worker service: a persistent
// process that stays connected to Redis and picks up GitHub post-generation
// jobs the instant they're queued, instead of app.js's approach (worker
// embedded inside the same process as the web server) or the serverless
// cron-polling fallback in app/api/cron/route.js (worker recreated from
// scratch every tick, up to ~60s of latency per job).
import dotenv from "dotenv";

import { connectDB } from "./lib/db.js";
import { connectRedis, disconnectRedis } from "./lib/redis.js";
import "./lib/models.js";

dotenv.config();

async function main() {
  await connectDB();
  await connectRedis();

  const { startPostWorker } = await import("./lib/working.js");
  startPostWorker();

  console.log("> BullMQ worker process started, listening on queue \"my-queue\".");
}

async function shutdown() {
  console.log("> Worker shutting down...");

  const { stopPostWorker } = await import("./lib/working.js");
  await stopPostWorker();
  await disconnectRedis();
  process.exit(0);
}

main().catch((error) => {
  console.error("> Worker failed to start");
  console.error(error);
  process.exit(1);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
