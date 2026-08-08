import type { Metadata } from "next";
import type { ReactNode } from "react";

// app/onboarding/page.tsx is a client component and requires an active
// session — nothing here is reachable by a crawler, but noindex is added
// as a belt-and-suspenders guard (this route is intentionally not in
// app/robots.ts's disallow list, since Disallow would block Googlebot
// from ever seeing this noindex tag on a stray inbound link).
export const metadata: Metadata = {
  title: "Onboarding",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
