import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { approveInstagramDraft } from "@/lib/instagram-drafts";
import { User } from "@/lib/models";

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

// Instagram/Facebook Graph API takes one message per call, so bulk approve
// still sends N individual requests - this just runs them a few at a time
// instead of one-by-one so it doesn't trip Meta's rate limits.
const CONCURRENCY = 3;

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = await getCurrentUser(session);

    if (!currentUser) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = await request.json();
    const draftIds = Array.isArray(body.draftIds) ? body.draftIds : [];
    const validDraftIds = [...new Set(draftIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validDraftIds.length === 0) {
      return NextResponse.json({ error: "No valid draft IDs provided." }, { status: 400 });
    }

    const succeeded = [];
    const failed = [];

    for (let i = 0; i < validDraftIds.length; i += CONCURRENCY) {
      const batch = validDraftIds.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (draftId) => {
          try {
            return { draftId, result: await approveInstagramDraft({ userId: currentUser._id, draftId }) };
          } catch (error) {
            console.error(`Bulk approve failed for draft ${draftId}:`, error);
            return { draftId, result: { ok: false, error: "Unexpected error while sending this reply." } };
          }
        }),
      );

      for (const { draftId, result } of batchResults) {
        if (result.ok) {
          succeeded.push(result.draft);
        } else {
          failed.push({ id: draftId, error: result.error });
        }
      }
    }

    return NextResponse.json({
      message: `${succeeded.length} of ${validDraftIds.length} Instagram replies sent.`,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error("Error occurred while bulk approving Instagram drafts:", error);
    return NextResponse.json({ error: "Cannot send Instagram replies. Please try again later." }, { status: 500 });
  }
}
