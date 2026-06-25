import {dbConnect} from "@/lib/dbConnect";
import {Post} from "@/lib/models";
import {NextResponse} from "next/server";
import {getCurrentUser} from "@/app/api/share/linkedin/route";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const now = new Date();
  const posts = await Post.find({
    user_id: currentUser._id,
    scheduledTime: { $lte: now },
    status: "scheduled"
  }).select("_id pr_title content expires_at").lean();

  if (posts.length === 0) {
    console.log("No post remaining");
    return NextResponse.json({ message: "No posts due" });
  }

  const results = [];
  for (const post of posts) {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/share/linkedin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post._id.toString() }),
    });

    const data = await response.json();
    results.push({ postId: post._id, ...data });
  }

  
  return NextResponse.json({
    ok: true,
    platform: "linkedin",
    status: "published",
    count: results.length,
    results,
  });
}
