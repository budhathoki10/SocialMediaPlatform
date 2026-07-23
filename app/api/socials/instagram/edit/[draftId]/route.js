import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { normalizeDraftReply } from "@/lib/instagram-drafts";
import { InstagramDraft, User } from "@/lib/models";

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

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = await getCurrentUser(session);

    if (!currentUser) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const { draftId } = await params;

    if (!mongoose.Types.ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID." }, { status: 400 });
    }

    const body = await request.json();
    const draftReply = normalizeDraftReply(body?.draft);

    if (!draftReply) {
      return NextResponse.json({ error: "Draft reply cannot be empty." }, { status: 400 });
    }

    const draft = await InstagramDraft.findOne({
      _id: draftId,
      user_id: currentUser._id,
      status: "pending",
    });

    if (!draft) {
      return NextResponse.json({ error: "Pending draft not found." }, { status: 404 });
    }

    draft.draft_reply = draftReply;
    draft.updated_at = new Date();
    await draft.save();

    return NextResponse.json({
      message: "Instagram draft updated successfully.",
      draft: {
        id: draft._id.toString(),
        draft: draft.draft_reply,
      },
    });
  } catch (error) {
    console.error("Error occurred while updating Instagram draft:", error);
    return NextResponse.json({ error: "An error occurred while updating the Instagram draft." }, { status: 500 });
  }
}
