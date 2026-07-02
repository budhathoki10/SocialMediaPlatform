"use client";

import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  Camera,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Send,
  Settings,
  Share2,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

const sidebarItems = [
  { label: "Dashboard", Icon: LayoutDashboard, href: "/dashboard" },
  { label: "Create Post", Icon: CirclePlus, href: "/dashboard/create-post" },
  { label: "Scheduled Posts", Icon: CalendarDays, href: "/dashboard/scheduled-posts" },
  { label: "Auto Reply", Icon: MessageSquare, href: "#" },
  { label: "News Feed", Icon: Newspaper, href: "/dashboard/tech-news" },
];

const socialItems = [
  { label: "WhatsApp", Icon: MessageCircle, message: "clicked in whatsapp" },
  { label: "Facebook", Icon: Send, message: "clicked in facebook" },
  { label: "Instagram", Icon: Camera, message: "clicked in instagram" },
  { label: "Gmail", Icon: Mail, message: "clicked in gmail" },
];

function SidebarIconTooltip({ label, children }: { children: React.ReactNode; label: string }) {
  return (
    <span className="sidebar-nav-icon">
      {children}
      <span className="sidebar-nav-tooltip">{label}</span>
    </span>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const socialContentRef = useRef<HTMLDivElement>(null);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialHeight, setSocialHeight] = useState(0);
  const socialActive = pathname.startsWith("/dashboard/socials");

  function toggleSocialMenu() {
    setSocialOpen((open) => {
      const nextOpen = !open;
      setSocialHeight(nextOpen ? socialContentRef.current?.scrollHeight || 0 : 0);
      return nextOpen;
    });
  }

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
        {sidebarItems.map(({ label, Icon, href }) => {
          const active = href !== "#" && pathname === href;

          return (
            <Link key={label} href={href} className={`sidebar-nav-item ${active ? "sidebar-nav-item-active" : ""}`}>
              <SidebarIconTooltip label={label}>
                <Icon />
              </SidebarIconTooltip>
              <span className="sidebar-nav-label">{label}</span>
            </Link>
          );
        })}

        <div>
          <button
            type="button"
            aria-expanded={socialOpen}
            onClick={toggleSocialMenu}
            className={`sidebar-nav-item sidebar-nav-button ${socialOpen || socialActive ? "sidebar-nav-item-active" : ""}`}
          >
            <SidebarIconTooltip label="Socials">
              <Share2 />
            </SidebarIconTooltip>
            <span className="sidebar-nav-label">Socials</span>
            <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform duration-300 ${socialOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`sidebar-social-panel ${socialOpen ? "sidebar-social-panel-open" : ""}`} style={{ height: socialHeight }}>
            <div ref={socialContentRef} className="space-y-1 py-1.5">
              {socialItems.map(({ label, Icon, message }) => (
                <button key={label} type="button" onClick={() => alert(message)} className="sidebar-social-item">
                  <span className="grid h-5 w-5 place-items-center">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Link href="#" className="sidebar-nav-item">
          <SidebarIconTooltip label="Settings">
            <Settings />
          </SidebarIconTooltip>
          <span className="sidebar-nav-label">Settings</span>
        </Link>
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
