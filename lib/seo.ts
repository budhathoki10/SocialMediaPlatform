// Single source of truth for site-wide SEO/AEO constants — imported by
// app/layout.tsx, app/sitemap.ts, app/robots.ts, app/manifest.ts, and the
// opengraph-image routes, so the production domain and brand copy only
// ever live in one place.
const DEFAULT_SITE_URL = "https://www.kushalbudhathoki.com.np";

export const SITE_URL = (process.env.NEXTAUTH_URL || DEFAULT_SITE_URL).replace(/\/$/, "");

export const SITE_NAME = "AutoPilot";

export const SITE_TITLE = "AutoPilot — Social Media Automation on Autopilot";

export const SITE_DESCRIPTION =
  "AutoPilot automates your entire social presence: turn GitHub activity into AI-written LinkedIn posts, auto-reply to Instagram comments and DMs, and schedule content across every channel from one dashboard.";

export const SITE_KEYWORDS = [
  "social media automation",
  "AI social media scheduler",
  "auto post LinkedIn from GitHub",
  "GitHub activity to LinkedIn",
  "Instagram auto reply AI",
  "AI caption generator",
  "social media scheduling tool for developers",
];
