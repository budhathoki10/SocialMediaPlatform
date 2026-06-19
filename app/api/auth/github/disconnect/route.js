import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "GitHub disconnect route ready. Delete the user's github connected_accounts record here.",
  });
}
