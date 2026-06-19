import { NextResponse } from "next/server";
import { GetGitHubUrl } from "@/lib/github";

export async function GET() {
  return NextResponse.redirect(GetGitHubUrl());
}