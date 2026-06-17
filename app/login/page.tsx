"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.35 0-4.34-1.58-5.05-3.72H.93v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.41 5.41 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.93A9 9 0 0 0 0 9c0 1.45.34 2.82.93 4.03l3.02-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .93 4.97L3.95 7.3C4.66 5.16 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function getCallbackUrl() {
  const fallback = "/onboarding";

  if (typeof window === "undefined") {
    return fallback;
  }

  const params = new URLSearchParams(window.location.search);
  const callbackUrl = params.get("callbackUrl") || fallback;

  if (callbackUrl.startsWith("/")) {
    return callbackUrl;
  }

  try {
    const targetUrl = new URL(callbackUrl);

    if (targetUrl.origin === window.location.origin) {
      return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(getCallbackUrl());
    }
  }, [router, status]);

  async function handleGoogleLogin() {
    setIsLoading(true);
    await signIn("google", {
      callbackUrl: getCallbackUrl(),
    });
    setIsLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-12 text-slate-950">
      <section className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white px-9 py-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10">
        <div className="flex justify-center">
          <Image
            src="/landing/autopilot-logo.png"
            alt="AutoPilot"
            width={161}
            height={60}
            className="h-14 w-auto"
            priority
          />
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to manage your automation workflows.</p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          // disabled={isLoading || status === "loading" || status === "authenticated"}
          className="mt-8 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-1400 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleLogo />
          {/* {isLoading || status === "authenticated" ? "Onboarding..." : "Continue with Google"} */}
          Continue with Google
        </button>

        <div className="mt-12 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <a href="#" className="transition hover:text-slate-950">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-slate-950">
              Terms of Service
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
