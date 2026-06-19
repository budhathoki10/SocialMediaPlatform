import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("Received GitHub webhook request");
  const eventType = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");
  const payload = await req.json().catch(() => null);
  console.log("Event Type:", eventType);
  console.log("Delivery ID:", deliveryId);
  console.log("Payload:", payload);

  
  return NextResponse.json({
    message: "GitHub webhook route ready.",
    eventType,
    deliveryId,
    repository: payload?.repository?.full_name || null,
  });
}
