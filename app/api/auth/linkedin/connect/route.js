import { NextResponse } from "next/server";
import { GetLinkedInUrl } from "@/lib/linkedin";

export async function GET() {
  return NextResponse.redirect(GetLinkedInUrl());
}