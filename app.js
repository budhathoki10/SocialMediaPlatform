import dotenv from "dotenv";
import express from "express";
import next from "next";

import { connectDB } from "./lib/db.js";
import { connectRedis, disconnectRedis } from "./lib/redis.js";
import "./lib/models.js";

dotenv.config();

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const isDevelopment = process.env.NODE_ENV !== "production" && process.env.npm_lifecycle_event !== "start";

process.env.NODE_ENV = isDevelopment ? "development" : "production";

const nextApp = next({
  dev: isDevelopment,
  hostname,
  port,
});
const handleNextRequest = nextApp.getRequestHandler();
const expressApp = express();
let stopPostWorker;

async function main() {
  const database = await connectDB();
  const redis = await connectRedis();
  const workerModule = await import("./lib/working.js");

  workerModule.startPostWorker();
  stopPostWorker = workerModule.stopPostWorker;

  await nextApp.prepare();

  // Do not enable express.json() globally. Next.js API routes must receive
  // the original request stream so GitHub webhook payloads can be verified/read.
  expressApp.get("/express-health", (req, res) => {
    res.json({
      ok: true,
      database: {
        name: database.connection.name,
        host: database.connection.host,
        readyState: database.connection.readyState,
      },
      redis: {
        status: redis.status,
      },
    });
  });

  expressApp.use((req, res) => handleNextRequest(req, res));

  expressApp.listen(port, hostname, () => {
    const localUrl = `http://localhost:${port}`;
    const publicUrl = process.env.NEXTAUTH_URL;

    console.log(`> Server listening locally at ${localUrl} as ${process.env.NODE_ENV}`);

    if (publicUrl) {
      console.log(`> Public URL: ${publicUrl}`);
    }
  });
}

async function shutdown() {
  await stopPostWorker?.();
  await disconnectRedis();
  process.exit(0);
}

main().catch((error) => {
  console.error("> Failed to start server");
  console.error(error);
  process.exit(1);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);