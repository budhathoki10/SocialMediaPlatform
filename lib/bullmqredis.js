import IoRedis from "ioredis";



export const redisConnection= new IoRedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // retry indefinitely until the connection is established
}); 
