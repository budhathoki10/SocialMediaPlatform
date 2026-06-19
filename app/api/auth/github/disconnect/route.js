import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, User } from "@/lib/models";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

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

  if (session.user.email) {
    return User.findOne({ email: session.user.email }).select("_id");
  }

  return null;
}

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  await ConnectedAccount.findOneAndUpdate(
    { user_id: currentUser._id, platform: "github" },
    { $set: { status: "revoked" } },
  );

  return NextResponse.json({ connected: false, platform: "github" });
}