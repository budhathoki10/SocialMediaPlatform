import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { ConnectedAccount } from "@/lib/models";
import { myQueue } from "@/lib/queue";

function parseGithubPayload(rawBody, contentType) {
  if (!rawBody) {
    return null;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = new URLSearchParams(rawBody);
    const payload = form.get("payload");
    return payload ? JSON.parse(payload) : null;
  }

  return JSON.parse(rawBody);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "GitHub webhook endpoint is alive. GitHub should call this URL with POST.",
  });
}

export async function POST(req) {
  const eventType = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");
  const contentType = req.headers.get("content-type") || "";
  const rawBody = await req.text();

  let payload;

  try {
    payload = parseGithubPayload(rawBody, contentType);
  } catch (error) {
    console.error("Unable to parse GitHub webhook payload:", error);
    return NextResponse.json({ ok: false, error: "Invalid webhook payload." }, { status: 400 });
  }

  if (eventType !== "pull_request" || payload?.action !== "closed" || !payload?.pull_request?.merged) {
    return NextResponse.json({ ok: true, message: "Webhook event received. No post job needed." });
  }

  const repo = payload.repository?.full_name;
  const githubUsername = payload.repository?.owner?.login;

  if (!repo || !githubUsername) {
    console.error("Merged pull request payload is missing repository owner data.");
    return NextResponse.json({ ok: false, error: "Repository details are missing." }, { status: 400 });
  }

  await connectDB();
  const account = await ConnectedAccount.findOne({
    platform: "github",
    platform_username: githubUsername,
    status: "active",
  }).select("user_id");

  if (!account) {
    console.warn(`No active AutoPilot GitHub connection found for ${githubUsername}.`);
    return NextResponse.json({ ok: true, message: "Webhook received, but no connected user matched this repository." });
  }

  const job = await myQueue.add(
    "generatePost",
    {
      repo,
      type: "pull_request",
      prTitle: payload.pull_request.title,
      prBody: payload.pull_request.body,
      userId: account.user_id.toString(),
    },
    { jobId: deliveryId || undefined },
  );

  console.log("Job queued for merged PR:", payload.pull_request.title, "job:", job.id);

  return NextResponse.json({ ok: true, queued: true, jobId: job.id }, { status: 202 });
}