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
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import PressableButton from "@/components/motion/PressableButton";
import { SPRING } from "@/lib/motion/tokens";

const sidebarItems = [
  { label: "Dashboard", Icon: LayoutDashboard, href: "/dashboard" },
  { label: "Create Post", Icon: CirclePlus, href: "/dashboard/create-post" },
  { label: "Scheduled Posts", Icon: CalendarDays, href: "/dashboard/scheduled-posts" },
  { label: "Auto Reply", Icon: MessageSquare, href: "/dashboard/auto-reply" },
  { label: "News Feed", Icon: Newspaper, href: "/dashboard/tech-news" },
];

const socialItems = [
  { label: "WhatsApp", image: "/landing/whatsapp.png", message: "clicked in whatsapp  " },
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
  const [socialOpen, setSocialOpen] = useState(false);
  const socialActive = pathname.startsWith("/dashboard/socials");

  return (
    
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-5 py-6 lg:flex">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <span className="relative h-8 w-8 overflow-hidden rounded-control">
            <Image
              src="/landing/final-center-logo.png"
              alt=""
              width={267}
              height={267}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <span className="text-sm font-extrabold text-primary">AutoPilot</span>
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
            </Link>
          );
        })}

        <div>
          <button
            type="button"
            aria-expanded={socialOpen}
            onClick={() => setSocialOpen((open) => !open)}
            className={`sidebar-nav-item sidebar-nav-button ${socialOpen || socialActive ? "sidebar-nav-item-active" : ""}`}
          >
            <SidebarIconTooltip label="Socials">
              <Share2 />
            </SidebarIconTooltip>
            <span className="sidebar-nav-label">Socials</span>
            <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform duration-300 ${socialOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Motion measures "auto" itself (no scrollHeight ref/state
              juggling needed) — it animates to the real content height and
              settles back to auto once open, so late-loading content still
              fits. */}
          <motion.div
            initial={false}
            animate={{ height: socialOpen ? "auto" : 0 }}
            transition={SPRING.panel}
            className="overflow-hidden"
          >
            <div className="space-y-1 py-1.5">
              {socialItems.map(({ label, image, message, href }) => {
                const iconEl = <Image src={image} alt="" width={20} height={20} className="h-4 w-4 rounded-sm object-contain" />;

                return href ? (
                  <Link key={label} href={href} className={`sidebar-social-item ${pathname === href ? "text-primary" : ""}`}>
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
          </motion.div>
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
          {comingSoonPill}
        </Link>
      </nav>

      <div className="mt-auto">
        <div className="rounded-card border border-primary/20 bg-primary-tint px-4 py-5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-primary">Upgrade to Pro</p>
            {comingSoonPill}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-600">Unlock advanced automation tools and analytics.</p>
          <PressableButton
            type="button"
            onClick={() => alert("Billing is coming soon — we're still building this.")}
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-control bg-primary text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </PressableButton>
        </div>

        <div className="mt-5 space-y-2">
          <a href="#" className="flex h-9 items-center gap-3 rounded-control px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <CircleHelp className="h-4 w-4" />
            Help Center
          </a>
          <Link href="/logoutPage" className="flex h-9 items-center gap-3 rounded-control px-4 text-sm font-medium text-red-500 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
}
