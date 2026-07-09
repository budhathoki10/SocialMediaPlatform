import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { addInstagramDraftListener } from "@/lib/instagram-live-events";
import { User } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCurrentUser(session) {
  if (!session?.user?.id && !session?.user?.email) {
    return null;
  }

  await connectDB();

  if (session.user.id) {
    const user = await User.findById(session.user.id).select("_id");

    if (user) {
      return user;
    }
  }

  return User.findOne({ email: session.user.email }).select("_id");
}

function sseMessage(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const currentUser = await getCurrentUser(session);

  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup = null;
  let heartbeat = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseMessage("connected", { ok: true })));

      cleanup = addInstagramDraftListener(currentUser._id, (draft) => {
        controller.enqueue(encoder.encode(sseMessage("instagram-draft", draft)));
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(sseMessage("ping", { time: new Date().toISOString() })));
      }, 25000);
    },
    cancel() {
      if (cleanup) {
        cleanup();
      }

      if (heartbeat) {
        clearInterval(heartbeat);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
