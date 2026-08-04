import type { MetadataRoute } from "next";

// Next.js serves this at /sitemap.xml automatically. Only the public,
// unauthenticated marketing/legal pages belong here — every /dashboard/*
// route (and /onboarding) requires a signed-in session (see
// app/dashboard/layout.tsx), so listing them would just send Google crawl
// requests at pages it can never actually see the content of.
const baseUrl = (process.env.NEXTAUTH_URL || "https://www.kushalbudhathoki.com.np").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      // Route is named /billing but renders the public Pricing page (see app/billing/page.tsx).
      url: `${baseUrl}/billing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date("2026-07-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
