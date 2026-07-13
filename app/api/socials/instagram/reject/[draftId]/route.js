import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
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

    if (body.action !== "reject") {
      return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }

    const draft = await InstagramDraft.findOne({
      _id: draftId,
      user_id: currentUser._id,
      status: "pending",
    });

    if (!draft) {
      return NextResponse.json({ error: "Pending draft not found." }, { status: 404 });
    }

    draft.status = "rejected";
    draft.updated_at = new Date();
    await draft.save();

    return NextResponse.json({
      message: "Instagram draft rejected successfully.",
      draft: {
        id: draft._id.toString(),
        status: draft.status,
      },
    });
  } catch (error) {
    console.error("Error occurred while rejecting Instagram draft:", error);
    return NextResponse.json({ error: "An error occurred while rejecting the Instagram draft." }, { status: 500 });
  }
}