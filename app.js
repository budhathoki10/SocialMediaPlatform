import dotenv from "dotenv";
import express from "express";
import next from "next";
import { connectDB } from "./lib/db.js";
import { connectRedis, disconnectRedis } from "./lib/redis.js";
import "./lib/models.js";

// Load variables from the .env file.
dotenv.config();

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

let isDevelopment = true;

if (process.env.NODE_ENV === "production" || process.env.npm_lifecycle_event === "start") {
  isDevelopment = false;
}

process.env.NODE_ENV = isDevelopment ? "development" : "production";

const nextApp = next({
  dev: isDevelopment,
  hostname,
  port,
});

const handleNextRequest = nextApp.getRequestHandler();
const expressApp = express();

async function main() {
  // Connect to the services our app needs before accepting requests.
  const database = await connectDB();
  const redis = await connectRedis();

  // Prepare Next.js pages and API routes.
  await nextApp.prepare();

  expressApp.use(express.json());

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

  // Let Next.js handle all pages and app/api routes.
  expressApp.use((req, res) => {
    return handleNextRequest(req, res);
  });

  expressApp.listen(port, hostname, () => {
    const displayHost = hostname === "0.0.0.0" ? "localhost" : hostname;

    console.log(`> Server listening at http://${displayHost}:${port} as ${process.env.NODE_ENV}`);
  });
}

async function shutdown() {
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
