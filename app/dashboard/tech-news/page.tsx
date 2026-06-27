import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Settings,
  SquareTerminal,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const sidebarItems = [
  { label: "Dashboard", Icon: LayoutDashboard, href: "/dashboard" },
  { label: "Create Post", Icon: CirclePlus, href: "#" },
  { label: "Scheduled Posts", Icon: CalendarDays, href: "#" },
  { label: "Auto Reply", Icon: MessageSquare, href: "#" },
  { label: "Tech News", Icon: Newspaper, href: "/dashboard/tech-news", active: true },
  { label: "GitHub Automation", Icon: SquareTerminal, href: "/dashboard/github" },
  { label: "Analytics", Icon: BarChart3, href: "#" },
  { label: "Settings", Icon: Settings, href: "#" },
];

const newsItems = [
  {
    id: "llm-human-achieves",
    source: "TechCrunch",
    category: "AI & Robotics",
    timeAgo: "15 minutes ago",
    title: "New Large Language Model Achieves Human-Level Reasoning",
    summary: "OpenAI's latest iteration showcases unprecedented reasoning capabilities in complex technical workflows.",
    image: "/landing/real.PNG",
    status: "ready",
  },
  {
    id: "post-quantum-shift",
    source: "HackerNews",
    category: "Cybersecurity",
    timeAgo: "42 minutes ago",
    title: "The Shift Towards Post-Quantum Cryptography: Why Infrastructure Teams Are Preparing Now",
    summary: "Security experts urge a rapid transition to quantum-resistant algorithms as hardware advances accelerate.",
    image: "/landing/hero-dashboard.png",
    status: "warning",
  },
  {
    id: "open-source-impact",
    source: "GitHub Blog",
    category: "Open Source",
    timeAgo: "2 hours ago",
    title: "Announcing the Global Impact Fund for Critical Open Source Infrastructure",
    summary: "A new initiative aims to support maintainers behind widely used tools and core software ecosystems.",
    image: "/landing/realtimeanalytics.png",
    status: "published",
  },
  {
    id: "apple-m4-neural",
    source: "The Verge",
    category: "Hardware",
    timeAgo: "3 hours ago",
    title: "Apple's M4 Chipset: Everything We Know About the New Neural Engine",
    summary: "Leaks suggest a massive jump in NPU operations per second, positioning the next chipset for AI-first apps.",
    image: "/landing/AICaption.png",
    status: "ready",
  },
];

function Sidebar() {
  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-5 py-6 lg:flex">
      <div>
        <Image
          src="/landing/autopilot-logo.png"
          alt="AutoPilot"
          width={250}
          height={60}
          className="h-auto w-[112px]"
          priority
        />
        <p className="mt-2 pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Automation Suite</p>
      </div>

      <nav className="mt-8 space-y-1.5">
        {sidebarItems.map(({ label, Icon, active, href }) => (
          <Link
            key={label}
            href={href}
            className={`flex h-10 items-center gap-3 rounded-md px-3.5 text-sm font-semibold transition ${
              active ? "bg-[#eef2ff] text-[#4338ca]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="rounded-lg border border-indigo-100 bg-[#f4f6ff] px-4 py-5">
          <p className="text-sm font-bold text-[#4338ca]">Upgrade to Pro</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">Unlock advanced automation tools and analytics.</p>
          <button className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#4338ca] text-sm font-bold text-white transition hover:bg-[#3730a3]">
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <a href="#" className="flex h-9 items-center gap-3 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <CircleHelp className="h-4 w-4" />
            Help Center
          </a>
          <Link href="/logoutPage" className="flex h-9 items-center gap-3 rounded-lg px-4 text-sm font-medium text-red-500 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
}

function StatusDot({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-blue-50 text-blue-600",
    ready: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
  };

  return (
    <span className={`grid h-6 w-6 place-items-center rounded-full ${styles[status] || styles.ready}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}

export default async function TechNewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/tech-news");
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="flex h-screen">
        <Sidebar />

        <section className="h-screen min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Tech News Feed</h1>
                <p className="mt-1 text-sm text-slate-500">Curated technology updates ready to turn into social posts.</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[#4338ca]" />
                  All News
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {newsItems.map((news) => (
                <article
                  key={news.id}
                  className="grid min-h-[150px] cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md sm:grid-cols-[148px_minmax(0,1fr)]"
                >
                  <div className="relative h-32 overflow-hidden bg-slate-100 sm:h-full">
                    <Image
                      src={news.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 148px, 100vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                      {news.timeAgo} <span className="px-1.5">•</span> {news.category}
                    </p>
                    <h2 className="mt-2 line-clamp-2 text-[15px] font-extrabold leading-5 text-slate-950">{news.title}</h2>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{news.summary}</p>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        <StatusDot status={news.status} />
                        {news.source}
                      </div>
                      <button className="h-7 rounded-md bg-[#4338ca] px-3 text-xs font-bold text-white transition hover:bg-[#3730a3]">
                        Post This
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
