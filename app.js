import { createServer } from "node:http";
import dotenv from "dotenv";
import next from "next";
import { connectDB } from "./lib/db.js";
import "./lib/models.js";

dotenv.config();

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const lifecycleEvent = process.env.npm_lifecycle_event;

const dev =
  process.env.NODE_ENV === "production"
    ? false
    : process.env.NODE_ENV === "development"
      ? true
      : lifecycleEvent !== "start";

process.env.NODE_ENV = dev ? "development" : "production";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await connectDB();
  await app.prepare();

  createServer((req, res) => {
    handle(req, res);
  }).listen(port, hostname, () => {
    const displayHost = hostname === "0.0.0.0" ? "localhost" : hostname;
    console.log(`> Server listening at http://${displayHost}:${port} as ${process.env.NODE_ENV}`);
  });
}

main().catch((error) => {
  console.error("> Failed to start server");
  console.error(error);
  process.exit(1);
});
