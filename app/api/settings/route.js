import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, Post, User } from "@/lib/models";

const CONNECTED_PLATFORMS = ["github", "linkedin", "instagram"];

// Free-tier post cap from the project's own planning doc — not enforced
// anywhere server-side yet, shown for reference only (see README "Not Yet
// Implemented": billing/plan enforcement).
const FREE_PLAN_MONTHLY_POST_CAP = 5;

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user;

  if (!sessionUser?.id && !sessionUser?.email) {
    return null;
  }

  await connectDB();

  if (sessionUser.id) {
    const user = await User.findById(sessionUser.id);
    if (user) return user;
  }

  if (sessionUser.email) {
    return User.findOne({ email: sessionUser.email });
  }

  return null;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [accounts, postsThisMonth] = await Promise.all([
    ConnectedAccount.find({ user_id: user._id, platform: { $in: CONNECTED_PLATFORMS } })
      .select("platform platform_username status connected_at")
      .lean(),
    Post.countDocuments({ user_id: user._id, created_at: { $gte: startOfMonth } }),
  ]);
  const accountsByPlatform = new Map(accounts.map((account) => [account.platform, account]));

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      plan: user.plan,
      timezone: user.timezone,
    },
    connectedAccounts: CONNECTED_PLATFORMS.map((platform) => {
      const account = accountsByPlatform.get(platform);
      const connected = Boolean(account && account.status === "active");

      return {
        platform,
        connected,
        username: account?.platform_username || null,
        connectedAt: account?.connected_at?.toISOString?.() || account?.connected_at || null,
      };
    }),
    billing: {
      postsThisMonth,
      postCap: FREE_PLAN_MONTHLY_POST_CAP,
    },
  });
}
