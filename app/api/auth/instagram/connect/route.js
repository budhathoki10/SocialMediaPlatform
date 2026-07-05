import { NextResponse } from "next/server";
import { GetInstagramURL } from "@/lib/instagram";

export async function GET() {
  return NextResponse.redirect(GetInstagramURL());
}