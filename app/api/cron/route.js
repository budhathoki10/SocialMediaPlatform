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

  const queueResult = await processQueuedPostJobs({ maxRuntimeMs: 15_000 });

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

    // A failed publish must NOT leave "scheduled" status, otherwise this same
    // post keeps matching the `scheduled_time <= now` query above forever —
    // every future cron tick re-attempts it and re-embeds its full error in
    // this response, which is what was blowing past cron-job.org's response
    // size limit on every single run.
    if (!result.ok) {
      await Post.updateOne({ _id: post._id }, { $set: { status: "failed" } });
    }

    // Keep the response small regardless of how large a single failure's
    // raw error text is (LinkedIn/API error bodies can be verbose) — the
    // cron caller only needs enough to know what happened, not the full body.
    const trimmedResult =
      typeof result.error === "string" && result.error.length > 300
        ? { ...result, error: `${result.error.slice(0, 300)}…` }
        : result;

    results.push({ postId: post._id.toString(), ...trimmedResult });
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
