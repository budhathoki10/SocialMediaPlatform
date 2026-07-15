import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { rejectInstagramDraft } from "@/lib/instagram-drafts";
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

    // Rejecting is just a status update in our own database, no external API
    // call involved, so there's no need to throttle these like the approve path.
    const results = await Promise.all(
      validDraftIds.map(async (draftId) => ({
        draftId,
        result: await rejectInstagramDraft({ userId: currentUser._id, draftId }),
      })),
    );

    const succeeded = [];
    const failed = [];

    for (const { draftId, result } of results) {
      if (result.ok) {
        succeeded.push(result.draft);
      } else {
        failed.push({ id: draftId, error: result.error });
      }
    }

    return NextResponse.json({
      message: `${succeeded.length} of ${validDraftIds.length} Instagram drafts rejected.`,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error("Error occurred while bulk rejecting Instagram drafts:", error);
    return NextResponse.json({ error: "An error occurred while rejecting the Instagram drafts." }, { status: 500 });
  }
}
