import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarClock,
  Check,
  Code2,
  GitBranch,
  LaptopMinimal,
  Link2,
  MessageSquareText,
  MousePointer2,
  ShieldCheck,
  Star,
  WandSparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

type LandingCard = {
  icon: LucideIcon;
  title: string;
  copy: string;
  className?: string;
};

const featureCards: LandingCard[] = [
  {
    icon: MessageSquareText,
    title: "AI Captions",
    copy: "Generate platform-aware captions for any image or link. AutoPilot adapts your brand voice and formats for each channel.",
  },
  {
    icon: CalendarClock,
    title: "Smart Scheduling",
    copy: "Post when your audience is most active.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    copy: "Track growth across every platform with a single source of truth.",
  },
  {
    icon: GitBranch,
    title: "GitHub Automation",
    copy: "Automatically turn releases, issues, and commits into posts, bridging code and community.",
  },
];

const painCards: LandingCard[] = [
  {
    icon: WandSparkles,
    title: "Eliminate Writer's Block",
    copy: "AI helps you turn product updates and technical ideas into social narratives.",
  },
  {
    icon: CalendarClock,
    title: "Preserve Official Presence",
    copy: "Post while you sleep, study, or launch. Your brand stays active without constant checking.",
  },
  {
    icon: Bot,
    title: "Context-aware Automation",
    copy: "Rules, analytics, and GitHub workflows meet in one place, so you respond with the right context.",
  },
];

const growthCards: LandingCard[] = [
  {
    icon: Code2,
    title: "Developer First",
    copy: "Workflows built around releases, repositories, pull requests, and technical launch cycles.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Focused",
    copy: "Token storage, account isolation, and clear controls help keep automation predictable.",
  },
  {
    icon: LaptopMinimal,
    title: "Enterprise Grade",
    copy: "Scale campaigns across channels, teammates, and brand voices from one system.",
  },
];

const socialPlatforms = ["GitHub", "LinkedIn", "YouTube", "Instagram", "TikTok"];

const footerColumns = [
  ["Product", "Features", "Integrations", "Changelog"],
  ["Company", "About Us", "Careers", "Blog"],
  ["Resources", "Docs", "Community", "API"],
  ["Legal", "Privacy", "Terms"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fb] text-slate-950">
      <HeroSection />
      <FeaturesSection />
      <PainSection />
      <TestimonialSection />
      <GrowthSection />
      <DemoSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="hero-section relative min-h-screen border-b border-slate-200/80">
      <div className="shader-field" aria-hidden="true">
        <div className="shader-marquee">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="landing-reveal landing-reveal-down" style={{ animationDelay: "80ms" }}>
        <SiteNav />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-7xl flex-col justify-center px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-2xl">
            <div
              className="landing-reveal inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm shadow-indigo-100/40 backdrop-blur"
              style={{ animationDelay: "220ms" }}
            >
              <Workflow size={14} />
              AI growth engine for social automation
            </div>
            <h1
              className="landing-reveal mt-6 text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "320ms" }}
            >
              Automate your entire <span className="text-indigo-600">social presence.</span>
            </h1>
            <p
              className="landing-reveal mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg"
              style={{ animationDelay: "420ms" }}
            >
              Automate LinkedIn presence, powered by GitHub activity, AI captions, smart scheduling, and meaningful analytics.
            </p>
            <div className="landing-reveal mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "520ms" }}>
              <Link
                href="/login?callbackUrl=/onboarding"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
              >
                Get Started Free
                <ArrowRight size={16} />
              </Link>
              <a
                href="#demo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
              >
                <MousePointer2 size={16} />
                Watch Demo
              </a>
            </div>
            <div className="landing-reveal mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-600" style={{ animationDelay: "620ms" }}>
              <AvatarStack />
              <span>Join 50,000+ creators growing on autopilot</span>
            </div>
          </div>
          <div className="landing-reveal landing-reveal-right" style={{ animationDelay: "420ms" }}>
            <HeroVisual />
          </div>
        </div>
        <div className="landing-reveal landing-reveal-scale" style={{ animationDelay: "760ms" }}>
          <TrustBar />
        </div>
      </div>
    </section>
  );
}

function SiteNav() {
  return (
    <header className="relative z-10 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-9">
          <a href="#" className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-950">
            <Image
              src="/landing/autopilot-logo.png"
              alt="AutoPilot"
              width={161}
              height={60}
              className="h-15 w-auto mt-3"
              priority
            />
          </a>
          <div className="hidden items-center gap-9 text-sm font-semibold text-slate-500 md:flex">
            <a href="#features" className="transition hover:text-slate-950">
              Features
            </a>
            <a href="#customers" className="transition hover:text-slate-950">
              Customers
            </a>
            <a href="#about" className="transition hover:text-slate-950">
              About
            </a>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-6">
          <Link
            href="/login?callbackUrl=/onboarding"
            className="hidden text-sm font-semibold text-slate-500 transition hover:text-slate-950 sm:inline"
          >
            Log In
          </Link>
          <Link
            href="/login?callbackUrl=/onboarding"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500"
          >
            Get Started Free
          </Link>
        </div>
      </nav>
    </header>
  );
}

function HeroVisual() {
  return (
    <div className="hero-automation-visual relative mx-auto w-full max-w-2xl">
      <div className="hero-automation-stage">
        <Image
          src="/landing/final-wheel-no-logo.png"
          alt="Social automation settings wheel"
          width={500}
          height={500}
          className="hero-dashboard-image hero-automation-spin"
          priority
        />

          <Image
          src="/landing/final-center-logo-clean.png"
          alt="Social automation settings wheel"
          width={500}
          height={500}
          className="hero-dashboard-image hero-automation-image"
          priority
        />


      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <div className="relative mt-16 border-t border-slate-200/80 pt-8">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.36em] text-slate-400">
        Trusted by teams at
      </p>
      <div className="platform-cloud mt-7">
        {socialPlatforms.map((platform) => (
          <span key={platform} className="platform-pill">
            {platform}
          </span>
        ))}
        <span className="platform-pill platform-more">20+ more</span>
      </div>
    </div>
  );
}

function AvatarStack() {
  return (
    <Image
      src="/landing/creator-stack.png"
      alt="Creators growing on AutoPilot"
      width={132}
      height={48}
      className="h-10 w-auto sm:h-12"
    />
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="max-w-2xl">
          <p className="text-sm font-semibold text-indigo-600">Low-friction immersion.</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Everything you need to stay present.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            A unified automation stack designed to help you maintain a constant, high-quality presence powered by GitHub activity without the manual labor.
          </p>
        </ScrollReveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {featureCards.map(({ className, ...feature }, index) => (
            <ScrollReveal key={feature.title} className={className} delay={index * 90}>
              <FeatureCard {...feature} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PainSection() {
  return (
    <section className="bg-[#f4f6fa] px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <ScrollReveal>
          <p className="text-sm font-semibold text-indigo-600">Stop fighting the system.</p>
          <h2 className="mt-3 max-w-md text-4xl font-black leading-[1.02]">
            Stop fighting the <span className="text-indigo-600">algorithms.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Hours spent formatting, tracking posting windows, and replying to comments turn into one intentional flow. The tedious layer disappears so the work can travel further.
          </p>
        </ScrollReveal>
        <div className="grid gap-4">
          {painCards.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 80}>
              <InfoRow {...item} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialSection() {
  return (
    <section id="customers" className="bg-[#f4f6fa] px-5 pb-24 sm:px-8 lg:px-10">
      <ScrollReveal className="mx-auto max-w-7xl" variant="scale">
        <div className="rounded-[28px] bg-white px-6 py-10 shadow-sm shadow-slate-200 sm:px-10 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <div className="flex text-amber-400" aria-label="Five star rating">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="mt-6 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">
                &quot;AutoPilot didn&apos;t just save us time; it redefined how we interact with our developers. We&apos;re seeing{" "}
                <span className="text-indigo-600">3X engagement</span> with 90% less manual effort.&quot;
              </blockquote>
              <div className="mt-8 flex items-center gap-3">
                <Image
                  src="/landing/testimonial-avatar.png"
                  alt="Sarah Chen"
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold">Sarah Chen</p>
                  <p className="text-xs text-slate-500">VP Growth, Vercel</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <Metric value="20h+" label="Saved weekly per team member" />
              <Metric value="45%" label="Increase in developer replies" />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function GrowthSection() {
  return (
    <section id="about" className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl text-center">
        <ScrollReveal>
          <h2 className="text-3xl font-semibold sm:text-4xl">Engineered for growth.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Built by developers, for builders who demand reliability and scale from their automation stack.
          </p>
        </ScrollReveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {growthCards.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 90}>
              <GrowthCard {...item} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="bg-white px-5 pb-14 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="scale">
          <div className="video-placeholder">
            <div className="video-play">
              <MousePointer2 size={26} />
            </div>
            <div>
              <p>Demo video placeholder</p>
              <span>Add your product walkthrough video here later.</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-[#eef1f8] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
      <div className="cta-shader" aria-hidden="true" />
      <ScrollReveal className="relative mx-auto max-w-4xl text-center text-white" variant="fade">
        <h2 className="text-3xl font-black leading-none sm:text-4xl">Ready to put your growth on AutoPilot?</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-indigo-50">
          Automate your LinkedIn presence, powered by your GitHub activity. AutoPilot handles the noise so you can focus on building.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login?callbackUrl=/onboarding"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Get Started Free
            <ArrowRight size={16} />
          </Link>
          <a
            href="#demo"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Talk to Sales
            <ArrowRight size={16} />
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-[#f7f8fb] px-5 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_2fr]">
        <ScrollReveal>
        <div>
          <a href="#" className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <Image
              src="/landing/autopilot-logo.png"
              alt="AutoPilot"
              width={161}
              height={60}
              className="h-11 w-auto"
            />
          </a>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
            The all-in-one automation suite for modern developers and digital creators.
          </p>
          <div className="mt-6 flex gap-4 text-slate-500">
            <Link2 size={18} />
            <GitBranch size={18} />
          </div>
        </div>
        </ScrollReveal>
        <div className="grid gap-8 sm:grid-cols-4">
          {footerColumns.map(([title, ...items], index) => (
            <ScrollReveal key={title} delay={index * 70}>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-500">
                  {items.map((item) => (
                    <li key={item}>
                      <a href="#" className="transition hover:text-slate-950">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
      <ScrollReveal className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <>
          <p>© 2026 AutoPilot Automation Suite. Designed to be invisible.</p>
          <p className="flex items-center gap-2 text-emerald-600">
            <Check size={14} />
            All systems operational
          </p>
        </>
      </ScrollReveal>
    </footer>
  );
}

function FeatureCard({ icon: Icon, title, copy, className = "" }: LandingCard) {
  const hasImagePreview =
    title === "AI Captions" ||
    title === "Smart Scheduling" ||
    title === "Real-time Analytics" ||
    title === "GitHub Automation";

  return (
    <article className={`feature-card ${hasImagePreview ? "feature-card--visual feature-card--media" : ""} ${className}`}>
      <div className="feature-card-header">
        <div className="icon-box">
          <Icon size={17} />
        </div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      {title === "AI Captions" && <CaptionPreview />}
      {title === "Smart Scheduling" && <SchedulePreview />}
      {title === "Real-time Analytics" && <AnalyticsPreview />}
      {title === "GitHub Automation" && <GitHubPreview />}
    </article>
  );
}

function CaptionPreview() {
  return (
    <FeaturePreviewFrame>
      <Image
        src="/landing/AICaption.png"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="feature-preview-image caption-preview"
        aria-hidden="true"
      />
    </FeaturePreviewFrame>
  );
}

function SchedulePreview() {
  return (
    <FeaturePreviewFrame>
      <Image
        src="/landing/smartSchedule.png"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="feature-preview-image schedule-preview"
        aria-hidden="true"
      />
    </FeaturePreviewFrame>
  );
}

function AnalyticsPreview() {
  return (
    <FeaturePreviewFrame>
      <Image
        src="/landing/realtimeanalytics.png"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="feature-preview-image analytics-preview"
        aria-hidden="true"
      />
    </FeaturePreviewFrame>
  );
}

function GitHubPreview() {
  return (
    <FeaturePreviewFrame>
      <Image
        src="/landing/github.png"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="feature-preview-image github-preview"
        aria-hidden="true"
      />
    </FeaturePreviewFrame>
  );
}

function FeaturePreviewFrame({ children }: { children: ReactNode }) {
  return <div className="feature-preview-frame">{children}</div>;
}

function InfoRow({ icon: Icon, title, copy }: LandingCard) {
  return (
    <article className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="icon-box shrink-0">
        <Icon size={17} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
      </div>
    </article>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-6">
      <strong className="text-3xl font-black text-indigo-600">{value}</strong>
      <p className="mt-2 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function GrowthCard({ icon: Icon, title, copy }: LandingCard) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-left">
      <div className="icon-box">
        <Icon size={17} />
      </div>
      <h3 className="mt-8 text-base font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
    </article>
  );
}
