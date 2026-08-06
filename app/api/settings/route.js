import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { countAutoRepliesThisMonth, countScheduledPostsThisMonth, getPlanLimits } from "@/lib/entitlements";
import { ConnectedAccount, Subscription, User } from "@/lib/models";

const CONNECTED_PLATFORMS = ["github", "linkedin", "instagram"];

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

  const [accounts, postsThisMonth, autoRepliesThisMonth, subscription] = await Promise.all([
    ConnectedAccount.find({ user_id: user._id, platform: { $in: CONNECTED_PLATFORMS } })
      .select("platform platform_username status connected_at")
      .lean(),
    countScheduledPostsThisMonth(user._id),
    countAutoRepliesThisMonth(user._id),
    Subscription.findOne({ user_id: user._id, status: { $in: ["active", "past_due"] } })
      .sort({ created_at: -1 })
      .lean(),
  ]);
  const accountsByPlatform = new Map(accounts.map((account) => [account.platform, account]));
  const limits = getPlanLimits(user.plan);

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
      postCap: limits.scheduledPostsPerMonth === Infinity ? null : limits.scheduledPostsPerMonth,
      autoRepliesThisMonth,
      autoReplyCap: limits.autoRepliesPerMonth === Infinity ? null : limits.autoRepliesPerMonth,
      subscription: subscription
        ? {
            status: subscription.status,
            billingPeriod: subscription.billing_period,
            currentPeriodEnd: subscription.current_period_end?.toISOString?.() || null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        : null,
    },
  });
}
