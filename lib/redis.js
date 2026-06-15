import Redis from "ioredis";

// global. this is a special object that is shared across all modules in the same Node.js process. By attaching the Redis connection to the global object, we can ensure that all modules that require this file will share the same Redis connection, preventing multiple connections from being created and improving performance.  
const globalCache = globalThis;

if (!globalCache.redisConnection) {
  globalCache.redisConnection = {
    client: null,
    promise: null,
    url: null,
  };
}
// url takes like a string in the format of redis://localhost:6379
const  createRedisClient=(url) => {
  const client = new Redis(url, {
    maxRetriesPerRequest: null, // retry indefinitely until the connection is established
    enableReadyCheck: true, // check if the connection is ready before allowing commands to be executed
  });

  client.on("error", (error) => {
    console.error("> Redis error", error);
  });

  return client;
}
// This function is responsible for establishing a connection to the Redis server. It checks if a connection already exists and is ready, and if not, it creates a new connection using the provided URL. The connection is cached in the global object to ensure that it can be reused across different modules without creating multiple connections.
export async function connectRedis() {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("REDIS_URL is missing. Add it to .env.");
  }

  const cache = globalCache.redisConnection;

  if (cache.client && cache.url === url && cache.client.status === "ready") {
    return cache.client;
  }

  if (!cache.promise || cache.url !== url) {
    if (cache.client && cache.url !== url) {
      cache.client.disconnect();
    }

    cache.url = url;
    cache.client = createRedisClient(url);
    cache.promise = new Promise((resolve, reject) => {
      cache.client.once("ready", () => resolve(cache.client));
      cache.client.once("error", reject);
    });
  }

  return cache.promise;
}

export async function disconnectRedis() {
  const cache = globalCache.redisConnection;

  if (!cache.client) {
    return;
  }

  await cache.client.quit();
  cache.client = null;
  cache.promise = null;
  cache.url = null;
}

export default connectRedis;
