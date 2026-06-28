import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "technology";

  const params = new URLSearchParams({
    apikey: process.env.NEWS_API_KEY,
    language: "en",
    timezone: "Asia/Kathmandu",
    removeduplicate: "1",
    q: query,
  });
console.log('____________________________________________________________________________________________')
console.log("api key is", process.env.NEWS_API_KEY,) 
console.log(`https://newsdata.io/api/1/latest?${params.toString()}`)
  const response = await fetch(`https://newsdata.io/api/1/latest?${params.toString()}`, {
    next: { revalidate: 1800 },
  });

  const data = await response.json();
console.log("data is",data)
  return NextResponse.json({
    query,
    ok: response.ok,
    results: data.results || [],
  });
}