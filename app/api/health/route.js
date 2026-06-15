import { connectDB } from "@/lib/db.js";
import "@/lib/models.js";

export async function GET() {
  try {
    const mongoose = await connectDB();

    return Response.json({
      ok: true,
      database: {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        readyState: mongoose.connection.readyState,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Database connection failed",
      },
      { status: 500 },
    );
  }
}
