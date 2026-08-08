import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

// Mirrors app/sitemap.ts's reasoning: /dashboard and every API route have
// nothing for a crawler to index and would just waste crawl budget, so
// they're hard-disallowed. /login, /onboarding, and /error are left
// crawlable here but marked noindex in their own metadata (see
// app/login/layout.tsx, app/onboarding/layout.tsx, app/error/page.tsx)
// instead of disallowed, since Disallow would also block Google from ever
// seeing that noindex tag.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
