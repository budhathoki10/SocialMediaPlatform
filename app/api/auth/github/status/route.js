import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    connected: false,
    platform: "github",
    message: "GitHub status route ready. Read connected_accounts for the current user here.",
  });
}
