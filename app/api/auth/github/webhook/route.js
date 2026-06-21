import { NextResponse } from "next/server";
import {myQueue} from "@/lib/queue";

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
    message:"GitHub webhook endpoint is alive. GitHub should call this URL with POST.",
  });
}

export async function POST(req) {
  const eventType = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");
  const contentType = req.headers.get("content-type") || "";
  const rawBody = await req.text();

  let payload = null;

  try {
    payload = parseGithubPayload(rawBody, contentType);
  } catch (error) {
    console.error("Unable to parse GitHub webhook payload:", error);
  }

  console.log("Received GitHub webhook request");
  console.log("Event Type:", eventType);
  console.log("Delivery ID:", deliveryId);
  console.log("Content Type:", contentType);
  console.log("Repository:", payload?.repository?.full_name || null);
  console.log("Action:", payload?.action || null);

  console.log("Full Payload:", payload);
if(payload.commits){
  await myQueue.add("generatePost",{
  repo: body.repository.full_name,
      type: "Pull Request",
      commits: body.commits.map(c => c.message),
  })
}


  
}