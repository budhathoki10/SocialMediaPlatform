import {
  BarChart3,
  Bell,
  CalendarDays,
  CircleHelp,
  CirclePlus,
  Filter,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Plus,
  Search,
  Settings,
  SquareTerminal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { redirect } from "next/navigation";

type DashboardUser = {
  name?: string | null;
  avatar_url?: string | null;
  plan?: string | null;
};

const sidebarItems = [
  {
    label: "Dashboard",
    Icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Create Post",
    Icon: CirclePlus,
  },
  {
    label: "Scheduled Posts",
    Icon: CalendarDays,
  },
  {
    label: "Auto Reply",
    Icon: MessageSquare,
  },
  {
    label: "Tech News",
    Icon: Newspaper,
  },
  {
    label: "GitHub Automation",
    Icon: SquareTerminal,
  },
  {
    label: "Analytics",
    Icon: BarChart3,
  },
  {
    label: "Settings",
    Icon: Settings,
  },
];

const UserAvatar = ({ imageSrc, name }: { imageSrc?: string | null; name?: string | null }) => (
  <Image
    src={imageSrc || "/landing/testimonial-avatar.png"}
    alt={name ? `${name} avatar` : "User avatar"}
    width={40}
    height={40}
    className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
  />

);

const Sidebar = () => (
  <aside
    className="dashboard-reveal dashboard-reveal-left flex min-h-screen w-[232px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6"
    style={{ animationDelay: "80ms" }}
  >
    <div className="dashboard-reveal dashboard-reveal-scale" style={{ animationDelay: "220ms" }}>
      <Image
        src="/landing/autopilot-logo.png"
        alt="AutoPilot"
        width={250}
        height={150}
        className="ml-0.95"

  
        priority
      />
      <p className="mt-1 pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Automation Suite</p>
    </div>

    <nav className="mt-9 space-y-2">
      {sidebarItems.map(({ label, Icon, active }, index) => (
        <a
          key={label}
          href="#"
          className={`dashboard-reveal flex h-10 items-center gap-3 rounded-lg px-4 text-sm font-medium transition ${
            active ? "bg-indigo-50 text-[#4338ca]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`}
          style={{ animationDelay: `${300 + index * 55}ms` }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </a>
      ))}
    </nav>

    <div className="mt-auto">
      <div className="dashboard-reveal rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-5" style={{ animationDelay: "780ms" }}>
        <p className="text-sm font-bold text-[#4338ca]">Upgrade to Pro</p>
        <p className="mt-2 text-[11px] leading-5 text-slate-600">Unlock advanced automation tools and analytics.</p>
        <button className="mt-4 h-9 w-full rounded-lg bg-[#4338ca] text-sm font-bold text-white transition hover:bg-[#3730a3]">
          Upgrade Now
        </button>
      </div>

      <div className="dashboard-reveal mt-5 space-y-2" style={{ animationDelay: "880ms" }}>
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

const Toolbar = ({ user }: { user: DashboardUser | null }) => (


  <header
    className="dashboard-reveal dashboard-reveal-down flex h-[64px] items-center justify-between border-b border-slate-200 bg-white px-6"
    style={{ animationDelay: "170ms" }}
  >
    <label className="dashboard-reveal flex h-10 w-full max-w-[560px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 text-slate-400" style={{ animationDelay: "320ms" }}>
      <Search className="h-4 w-4" />
      <input
        type="search"
        placeholder="Search automation tasks..."
        className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
    </label>

    <div className="dashboard-reveal flex items-center gap-4" style={{ animationDelay: "380ms" }}>
      <button className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      </button>
      <button className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
        <Settings className="h-5 w-5" />
      </button>

      <div className="h-8 w-px bg-slate-200" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold leading-4 text-slate-700">{user?.name || "User"}</p>
          <p className="mt-1 text-xs capitalize text-slate-500">{user?.plan || "free"} Member</p>
        </div>
        <UserAvatar imageSrc={user?.avatar_url} name={user?.name} />
      </div>
    </div>
  </header>
);

const DashboardPage =  async () => {
  await connectDB()
const session = await getServerSession(authOptions);
const sessionUser = session?.user as { id?: string } | undefined;
const userid = sessionUser?.id;

if(!userid) {
return redirect("/login");
}
  const user = await User.findById(userid)
    .select("name avatar_url plan")
    .lean<DashboardUser>(); // convert to plain JavaScript object


  return (
    <main
      className="min-h-screen p-1 text-slate-950"
      style={{
        backgroundImage: "radial-gradient(#d9dde7 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      
        <div className="flex min-h-[calc(100vh-16px)]">
          <Sidebar />

          <section className="flex min-w-0 flex-1 flex-col">
            <Toolbar user={user} />

            <div className="flex-1 px-7 py-6">
              <div className="dashboard-reveal flex items-start justify-between gap-4" style={{ animationDelay: "420ms" }}>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">System Overview</h1>
                  <p className="mt-1 text-sm text-slate-600">Monitor your social presence and automation health.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                  <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4338ca] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#3730a3]">
                    <Plus className="h-4 w-4" />
                    New Task
                  </button>
                </div>
              </div>

              <div className="dashboard-reveal dashboard-reveal-scale mt-6 min-h-[560px] rounded-xl border border-dashed border-slate-200 bg-white" style={{ animationDelay: "560ms" }} />
            </div>
          </section>
        </div>
    </main>
  );
};

export default DashboardPage;
