import { publishLinkedInPost } from "@/app/api/share/linkedin/route";
import { Post, getKathmanduDate } from "@/lib/models";
import { NextResponse } from "next/server";

function isAuthorizedCronRequest(request) {
  if (!process.env.CRON_SECRET) return true;

  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request) {

  console.log("i am inside the cron job")
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = getKathmanduDate();
  const posts = await Post.find({
    scheduled_time: { $lte: now },
    status: "scheduled",
  })
    .select("_id user_id pr_title content scheduled_time expires_at")
    .lean();

  if (posts.length === 0) {
    return NextResponse.json({ message: "No posts due" });
  }

  const results = [];

  for (const post of posts) {
    const result = await publishLinkedInPost({
      postId: post._id.toString(),
      userId: post.user_id.toString(),
    });

    results.push({ postId: post._id.toString(), ...result });
  }

  return NextResponse.json({
    ok: true,
    platform: "linkedin",
    count: results.length,
    published: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  });
}
