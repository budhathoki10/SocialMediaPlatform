import mongoose from "mongoose";

const globalCache = globalThis;

if (!globalCache.mongooseConnection) {
  globalCache.mongooseConnection = {
    conn: null,
    promise: null,
    uri: null,
  };
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to .env.");
  }

  const cache = globalCache.mongooseConnection;

  if (cache.conn && cache.uri === uri) {
    return cache.conn;
  }

  if (!cache.promise || cache.uri !== uri) {
    cache.uri = uri;
    cache.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
      serverSelectionTimeoutMS: 10000,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export default connectDB;
