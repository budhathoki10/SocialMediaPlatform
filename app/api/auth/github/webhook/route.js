import { NextResponse } from "next/server";

export async function POST(request) {
  const eventType = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");
  const payload = await request.json().catch(() => null);

  return NextResponse.json({
    message: "GitHub webhook route ready.",
    eventType,
    deliveryId,
    repository: payload?.repository?.full_name || null,
  });
}
