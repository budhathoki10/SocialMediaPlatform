import { publishLinkedInPost } from "@/app/api/share/linkedin/route";
import { connectDB } from "@/lib/db";
import { Post, getKathmanduDate } from "@/lib/models";
import { processQueuedPostJobs } from "@/lib/working";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

function isAuthorizedCronRequest(request) {
  if (!process.env.CRON_SECRET) return true;

  const { searchParams } = new URL(request.url);

  return (
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` ||
    searchParams.get("secret") === process.env.CRON_SECRET
  );
}

export async function GET(request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const queueResult = await processQueuedPostJobs({ maxRuntimeMs: 45_000 });

  await connectDB();

  const now = getKathmanduDate();
  const posts = await Post.find({
    scheduled_time: { $lte: now },
    
    status: "scheduled",
  })
    .select("_id user_id pr_title content scheduled_time expires_at")
    .lean();

  if (posts.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "No posts due",
      queue: queueResult,
      count: 0,
      published: 0,
      failed: 0,
    });
  }

  const results = [];

  for (const post of posts) {
    let result;

    try {
      result = await publishLinkedInPost({
        postId: post._id.toString(),
        userId: post.user_id.toString(),
      });
    } catch (error) {
      result = {
        ok: false,
        statusCode: 500,
        error: error instanceof Error ? error.message : "Unable to publish scheduled post.",
      };
    }

    results.push({ postId: post._id.toString(), ...result });
  }

  return NextResponse.json({
    ok: true,
    platform: "linkedin",
    queue: queueResult,
    count: results.length,
    published: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  });
}
