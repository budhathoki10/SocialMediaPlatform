import { NextResponse } from "next/server";
import { GetGitHubUrl } from "@/lib/github";

export async function GET() {
  const url = GetGitHubUrl();
  return NextResponse.json({ url });
}
