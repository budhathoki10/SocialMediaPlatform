import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, InstagramDraft, User } from "@/lib/models";

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

    if (body.action !== "approve") {
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

    if (!draft.sender_id) {
      return NextResponse.json({ error: "Instagram recipient ID is missing." }, { status: 400 });
    }

    if (!draft.draft_reply?.trim()) {
      return NextResponse.json({ error: "Draft reply is empty." }, { status: 400 });
    }

    const account = await ConnectedAccount.findOne({
      user_id: currentUser._id,
      platform: "instagram",
      status: "active",
    }).select("+access_token page_id");

    if (!account?.access_token) {
      return NextResponse.json({ error: "Connected Instagram account not found." }, { status: 404 });
    }

    if (!account.page_id) {
      return NextResponse.json(
        { error: "Connected Facebook Page ID is missing. Reconnect Instagram and try again." },
        { status: 400 },
      );
    }

    const instagramResponse = await fetch(
      `https://graph.facebook.com/v25.0/${account.page_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: draft.sender_id },
          message: { text: draft.draft_reply.trim() },
        }),
      },
    );

    const instagramResult = await instagramResponse.json().catch(() => ({}));

    if (!instagramResponse.ok) {
      console.error("Instagram reply failed:", instagramResult);

      return NextResponse.json(
        { error: instagramResult?.error?.message || "Instagram rejected the reply." },
        { status: instagramResponse.status },
      );
    }

    draft.status = "sent";
    draft.connected_account_id = account._id;
    draft.sent_at = new Date();
    draft.platform_message_id = instagramResult.message_id || null;
    draft.updated_at = new Date();
    await draft.save();

    return NextResponse.json({
      message: "Instagram reply sent successfully.",
      draft: {
        id: draft._id.toString(),
        status: draft.status,
        platformMessageId: draft.platform_message_id,
        sentAt: draft.sent_at,
      },
    });
  } catch (error) {
    console.error("Error occurred while sending Instagram reply:", error);
    return NextResponse.json({ error: "An error occurred while sending the Instagram reply." }, { status: 500 });
  }
}
