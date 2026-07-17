"use client";

import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Newspaper,
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
  { label: "WhatsApp", image: "/landing/whatsapp.png", message: "clicked in whatsapp" },
  { label: "Facebook", image: "/landing/facebook.png", message: "clicked in facebook" },
  { label: "Instagram", image: "/landing/insta.png", href: "/dashboard/socials/instagram" },
  { label: "Gmail", image: "/landing/gmail.png", message: "clicked in gmail" },
];

const comingSoonPill = (
  <span className="ml-auto rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
    Soon
  </span>
);

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
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <span className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image
              src="/landing/final-center-logo.png"
              alt=""
              width={1024}


              
              height={1024}
              className="absolute left-1/2 top-1/2 h-16 w-16 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
              priority
            />
          </span>
          <span className="text-sm font-extrabold text-[#4f46e5]">AutoPilot</span>
        </Link>
        <p className="mt-3 pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Automation Suite</p>
      </div>

      <nav className="mt-6 space-y-1.5">
        {sidebarItems.map(({ label, Icon, href }) => {
          const active = href !== "#" && pathname === href;

          return (
            <Link key={label} href={href} className={`sidebar-nav-item ${active ? "sidebar-nav-item-active" : ""}`}>
              <SidebarIconTooltip label={label}>
                <Icon />
              </SidebarIconTooltip>
              <span className="sidebar-nav-label">{label}</span>
              {label === "Auto Reply" && comingSoonPill}
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
              {socialItems.map(({ label, image, message, href }) => {
                const iconEl = <Image src={image} alt="" width={20} height={20} className="h-4 w-4 rounded-sm object-contain" />;

                return href ? (
                  <Link key={label} href={href} className={`sidebar-social-item ${pathname === href ? "text-[#4338ca]" : ""}`}>
                    <span className="grid h-5 w-5 place-items-center">{iconEl}</span>
                    <span>{label}</span>
                  </Link>
                ) : (
                  <button key={label} type="button" onClick={() => alert(message)} className="sidebar-social-item">
                    <span className="grid h-5 w-5 place-items-center">{iconEl}</span>
                    <span>{label}</span>
                    {comingSoonPill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/feedback"
          className={`sidebar-nav-item ${pathname === "/dashboard/feedback" ? "sidebar-nav-item-active" : ""}`}
        >
          <SidebarIconTooltip label="Feedback">
            <MessageCircle />
          </SidebarIconTooltip>
          <span className="sidebar-nav-label">Feedback</span>
        </Link>

        <Link href="#" className="sidebar-nav-item">
          <SidebarIconTooltip label="Settings">
            <Settings />
          </SidebarIconTooltip>
          <span className="sidebar-nav-label">Settings</span>
        </Link>
      </nav>

      <div className="mt-auto">
        <div className="rounded-lg border border-indigo-100 bg-[#f4f6ff] px-4 py-5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#4338ca]">Upgrade to Pro</p>
            {comingSoonPill}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">Unlock advanced automation tools and analytics.</p>
          <button
            type="button"
            onClick={() => alert("Billing is coming soon — we're still building this.")}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#4338ca] text-sm font-bold text-white transition hover:bg-[#3730a3]"
          >
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
