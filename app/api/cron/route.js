import { publishLinkedInPost } from "@/app/api/share/linkedin/route";
import { connectDB } from "@/lib/db";
import { Post, getKathmanduDate } from "@/lib/models";
import { processQueuedPostJobs, requeueStuckInstagramDrafts } from "@/lib/working";
import { NextResponse, after } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

// The run now outlives the request, so a minute-interval ping can arrive while
// the previous run is still draining. Skip overlapping runs in this process so
// two passes don't both pick up the same "scheduled" LinkedIn post.
let isCronRunInProgress = false;

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

  if (isCronRunInProgress) {
    return NextResponse.json({ ok: true, started: false, message: "Previous run still in progress" });
  }

  isCronRunInProgress = true;

  // Draining the queue can take 40s+ (worker.close() waits for an in-flight
  // model call), which blew past cron-job.org's 30s request timeout on every
  // ping. Respond immediately and do the work after the response is sent.
  after(async () => {
    try {
      const summary = await runCron();

      if (summary.published || summary.failed || summary.queue.completedCount || summary.queue.failedCount) {
        console.log("Cron run result:", summary);
      }
    } catch (error) {
      console.error("Cron run failed:", error);
    } finally {
      isCronRunInProgress = false;
    }
  });

  return NextResponse.json({ ok: true, started: true });
}

async function runCron() {
  // Recover any draft whose row was written but whose job never made it onto
  // the queue, so it gets drained in the same pass below.
  const requeued = await requeueStuckInstagramDrafts().catch((error) => {
    console.error("Unable to re-queue stuck Instagram drafts:", error);
    return 0;
  });

  // A single draft costs one model call (~15s), so a 15s window closed before
  // any job could finish. This runs after the response, so it is no longer
  // bound by cron-job.org's timeout; whatever doesn't drain is picked up next run.
  const queueResult = await processQueuedPostJobs({ maxRuntimeMs: 24_000 });

  await connectDB();

  const now = getKathmanduDate();
  const posts = await Post.find({
    scheduled_time: { $lte: now },

    status: "scheduled",
  })
    .select("_id user_id pr_title content scheduled_time expires_at")
    .lean();

  if (posts.length === 0) {
    return {
      queue: queueResult,
      requeuedInstagramDrafts: requeued,
      count: 0,
      published: 0,
      failed: 0,
    };
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

  return {
    platform: "linkedin",
    queue: queueResult,
    requeuedInstagramDrafts: requeued,
    count: results.length,
    published: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  };
}
