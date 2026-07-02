import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "AI Agents";
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "NEWS_API_KEY is missing" }, { status: 500 });
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    language: "en",
    timezone: "Asia/Kathmandu",
    removeduplicate: "1",
    sort: "relevancy",
    q: query,
  });
// https://dev.to/api/articles?tag=javascript&per_page=10&top=7${params.toString()}
  const response = await fetch(`https://newsdata.io/api/1/latest?${params.toString()}`, {
    next: { revalidate: 1800 },
  });
// console.log("________________________________________")
// console.log(`https://newsdata.io/api/1/latest?${params.toString()}`)
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data?.message || "Failed to fetch news" },
      { status: response.status },
    );
  }

  return NextResponse.json({
    query,
    ok: response.ok,
    results: data.results || [],
  });
}
