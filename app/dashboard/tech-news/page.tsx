import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Search,
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
    category: "Top, Technology",
    country: "United States Of America",
    date: "27 Jun 2026",
    image: "/landing/real.PNG",
    language: "English",
    publisher: "TechCrunch",
      Description: "Only available in professional and corporate plans",
    time: "11:10:19 PM",
    title: "New Large Language Model Achieves Human-Level Reasoning",
  },
  {
    id: "post-quantum-shift",
    category: "Cybersecurity",
    country: "India",
    date: "27 Jun 2026",
    image: "/landing/hero-dashboard.png",
    language: "English",
    publisher: "HackerNews",
    Description: "Only available in professional and corporate plans",
    time: "11:10:13 PM",
    title: "The Shift Towards Post-Quantum Cryptography: Why Infrastructure Teams Are Preparing Now",
  },
  {
    id: "open-source-impact",
    category: "Business",
    country: "United States Of America",
    date: "27 Jun 2026",
    image: "/landing/realtimeanalytics.png",
    language: "English",
    publisher: "GitHub Blog",
    Description: "Only available in professional and corporate plans",
    time: "11:09:51 PM",
    title: "Announcing the Global Impact Fund for Critical Open Source Infrastructure",
  },
  {
    id: "apple-m4-neural",
    category: "Hardware",
    country: "United States Of America",
    date: "27 Jun 2026",
    image: "/landing/AICaption.png",
    language: "English",
    publisher: "The Verge",
    Description: "Only available in professional and corporate plans",
    time: "11:09:13 PM",
    title: "Apple's M4 Chipset: Everything We Know About the New Neural Engine",
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
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="w-full">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Tech News Feed</h1>
                <p className="mt-1 text-sm text-slate-500">Curated technology updates ready to turn into social posts.</p>
                <div className="mt-4 flex w-full max-w-3xl items-center gap-2">
                  <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 shadow-sm">
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    <input
                      type="search"
                      placeholder="Search news by keyword: Technology"
                  
                      className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </label>
                  <button   className="h-9 rounded-lg bg-[#4338ca] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#3730a3]">
                    Search
                  </button>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[#4338ca]" />
                  All News
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="w-full">
                <div className="w-full">
                  <div className="grid grid-cols-[2.3fr_0.85fr_0.95fr_0.75fr_0.9fr_0.8fr_1.2fr] items-center gap-4 bg-[#114a86] px-4 py-4 text-sm font-bold text-white">
                    <div>News</div>
                    <div>
                      Date<span className="text-[10px] font-semibold">(GMT+05:45)</span>
                    </div>
                    <div>Country</div>
                    <div>Language</div>
                    <div>Category</div>
                    <div>Publisher</div>
                    <div>Description</div>
                  </div>

                  {newsItems.map((news) => (
                    <article
                      key={news.id}
                      className="grid cursor-pointer grid-cols-[2.3fr_0.85fr_0.95fr_0.75fr_0.9fr_0.8fr_1.2fr] items-center gap-4 border-b border-slate-200 px-4 py-4 last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          <Image src={news.image} alt="" fill sizes="128px" className="object-cover" />
                        </div>
                        <h2 className="line-clamp-3 text-[13px] font-extrabold leading-5 text-slate-950">{news.title}</h2>
                      </div>

                      <div className="text-xs leading-5 text-slate-950">
                        <p>{news.date}</p>
                        <p>{news.time}</p>
                      </div>
                      <div className="text-xs leading-5 text-slate-950">{news.country}</div>
                      <div className="text-xs text-slate-950">{news.language}</div>
                      <div className="text-xs leading-5 text-slate-950">{news.category}</div>
                      <div className="text-xs text-slate-950">{news.publisher}</div>
                      <div className="text-[11px] font-semibold uppercase leading-4 text-slate-950">{news.Description}</div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
