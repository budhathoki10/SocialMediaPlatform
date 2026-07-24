import { NextResponse } from "next/server";

// LinkedIn has its own real publishing route (app/api/share/linkedin/route.js),
// which Next.js matches before this dynamic catch-all. Every platform that
// reaches this route (instagram, facebook, ...) has no publish integration
// built yet, so it's rejected instead of silently faking a "published" status.
export async function POST(_request, context) {
  const { platform } = await context.params;

  return NextResponse.json(
    { error: `Posting to ${platform} isn't available yet.` },
    { status: 400 },
  );
}
