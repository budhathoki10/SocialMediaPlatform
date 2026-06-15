import { connectDB } from "@/lib/db.js";
import { connectRedis } from "@/lib/redis.js";
import "@/lib/models.js";

export async function GET() {
  try {
    const [mongoose, redis] = await Promise.all([connectDB(), connectRedis()]);

    return Response.json({
      ok: true,
      database: {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        readyState: mongoose.connection.readyState,
      },
      redis: {
        status: redis.status,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 },
    );
  }
}
