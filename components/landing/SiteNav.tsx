import Image from "next/image";
import Link from "next/link";

import PressableLink from "@/components/motion/PressableLink";

export default function SiteNav() {
  return (
    <header className="relative z-10 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-9">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-950">
            <Image
              src="/landing/autopilot-logo.png"
              alt="AutoPilot"
              width={161}
              height={60}
              className="mt-3 h-[60px] w-auto"
              style={{ width: "auto" }}
              priority
            />
          </Link>
          <div className="hidden items-center gap-9 text-sm font-semibold text-slate-500 md:flex">
            <Link href="/#features" className="transition hover:text-slate-950">
              Features
            </Link>
            <Link href="/billing" className="transition hover:text-slate-950">
              Pricing
            </Link>
            <Link href="/#customers" className="transition hover:text-slate-950">
              Customers
            </Link>
            <Link href="/#about" className="transition hover:text-slate-950">
              About
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-6">
          <PressableLink
            href="/login?callbackUrl=/onboarding"
            className="hidden text-sm font-semibold text-slate-500 transition hover:text-slate-950 sm:inline"
          >
            Log In
          </PressableLink>
          <PressableLink
            href="/login?callbackUrl=/onboarding"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-primary-hover"
          >
            Get Started Free
          </PressableLink>
        </div>
      </nav>
    </header>
  );
}
