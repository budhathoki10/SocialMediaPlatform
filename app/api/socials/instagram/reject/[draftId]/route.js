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

    const result = await rejectInstagramDraft({ userId: currentUser._id, draftId });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      message: "Instagram draft rejected successfully.",
      draft: result.draft,
    });
  } catch (error) {
    console.error("Error occurred while rejecting Instagram draft:", error);
    return NextResponse.json({ error: "An error occurred while rejecting the Instagram draft." }, { status: 500 });
  }
}