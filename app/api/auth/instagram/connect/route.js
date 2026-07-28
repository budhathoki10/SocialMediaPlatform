// This creates the Meta/Instagram authorization URL and redirects the user to Instagram login/permission screen.
import { NextResponse } from "next/server";
import { GetInstagramURL } from "@/lib/instagram";

export async function GET() {
  return NextResponse.redirect(GetInstagramURL());
}