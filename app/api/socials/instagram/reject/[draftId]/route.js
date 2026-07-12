import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import InstagramDraft from "@/models/InstagramDraft";
import { getCurrentUser } from "@/lib/getCurrentUser";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    await connectDB();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { draftId } = await params;

    if (!draftId) {
      return NextResponse.json(
        {
          success: false,
          message: "Draft ID is required",
        },
        { status: 400 }
      );
    }

    // Find draft
    const draft = await InstagramDraft.findOne({
      _id: draftId,
      user_id: currentUser._id,
    });

    if (!draft) {
      return NextResponse.json(
        {
          success: false,
          message: "Draft not found",
        },
        { status: 404 }
      );
    }

    // Prevent rejecting twice
    if (draft.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: `Draft is already ${draft.status}`,
        },
        { status: 409 }
      );
    }

    // Update draft
    const updatedDraft = await InstagramDraft.findOneAndUpdate(
      {
        _id: draftId,
        user_id: currentUser._id,
        status: "pending",
      },
      {
        $set: {
          status: "dismissed",
          rejected_at: new Date(),
          rejected_by: currentUser._id,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedDraft) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to reject draft",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Draft rejected successfully",
        draft: {
          id: updatedDraft._id,
          status: updatedDraft.status,
          rejectedAt: updatedDraft.rejected_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject draft error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to reject draft",
      },
      { status: 500 }
    );
  }
}