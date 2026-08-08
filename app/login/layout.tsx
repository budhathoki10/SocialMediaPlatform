import type { Metadata } from "next";
import type { ReactNode } from "react";

// app/login/page.tsx is a client component ("use client"), which can't
// export metadata itself — this server layout carries it instead.
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to AutoPilot to manage your social media automation workflows.",
  alternates: {
    canonical: "/login",
  },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
