"use client";

import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Settings,
  Share2,
  User,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import NotificationsButton from "@/components/dashboard/NotificationsButton";
import { ModalBackdrop } from "@/components/motion/Modal";
import { SPRING } from "@/lib/motion/tokens";

const sidebarItems = [
  { label: "Dashboard", Icon: LayoutDashboard, href: "/dashboard" },
  { label: "Create Post", Icon: CirclePlus, href: "/dashboard/create-post" },
  { label: "Scheduled Posts", Icon: CalendarDays, href: "/dashboard/scheduled-posts" },
  { label: "Auto Reply", Icon: MessageSquare, href: "/dashboard/auto-reply" },
  { label: "News Feed", Icon: Newspaper, href: "/dashboard/tech-news" },
];

const socialItems = [
  { label: "WhatsApp", image: "/landing/whatsapps.png", href: "/dashboard/socials/whatsapp" },
  { label: "Instagram", image: "/landing/insta.png", href: "/dashboard/socials/instagram" },
];

const settingsItems = [
  { label: "Profile", Icon: User, href: "/dashboard/settings" },
  { label: "Upgrade Plan", Icon: Zap, href: "/dashboard/settings/billing" },
];

function SidebarIconTooltip({ label, children }: { children: React.ReactNode; label: string }) {
  return (
    <span className="sidebar-nav-icon">
      {children}
      <span className="sidebar-nav-tooltip">{label}</span>
    </span>
  );
}

/** The sidebar's actual nav/account content, shared by the persistent desktop
 * aside and the mobile slide-over drawer so the two never drift apart.
 * `onNavigate` is only passed by the mobile drawer — it closes the drawer
 * when a link is followed (not on the logout button, which opens a
 * confirmation on top of the drawer instead). */
function SidebarNavContent({
  pathname,
  socialOpen,
  setSocialOpen,
  socialActive,
  settingsOpen,
  setSettingsOpen,
  settingsActive,
  onNavigate,
}: {
  pathname: string;
  socialOpen: boolean;
  setSocialOpen: (updater: (open: boolean) => boolean) => void;
  socialActive: boolean;
  settingsOpen: boolean;
  setSettingsOpen: (updater: (open: boolean) => boolean) => void;
  settingsActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2" onClick={onNavigate}>
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
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              className={`sidebar-nav-item ${active ? "sidebar-nav-item-active" : ""}`}
            >
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
              {socialItems.map(({ label, image, href }) => {
                const iconEl = <Image src={image} alt="" width={20} height={20} className="h-4 w-4 rounded-sm object-contain" />;

                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={onNavigate}
                    className={`sidebar-social-item ${pathname === href ? "text-primary" : ""}`}
                  >
                    <span className="grid h-5 w-5 place-items-center">{iconEl}</span>
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>

        <Link
          href="/dashboard/feedback"
          onClick={onNavigate}
          className={`sidebar-nav-item ${pathname === "/dashboard/feedback" ? "sidebar-nav-item-active" : ""}`}
        >
          <SidebarIconTooltip label="Feedback">
            <MessageCircle />
          </SidebarIconTooltip>
          <span className="sidebar-nav-label">Feedback</span>
        </Link>

        <div>
          <button
            type="button"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
            className={`sidebar-nav-item sidebar-nav-button ${settingsOpen || settingsActive ? "sidebar-nav-item-active" : ""}`}
          >
            <SidebarIconTooltip label="Settings">
              <Settings />
            </SidebarIconTooltip>
            <span className="sidebar-nav-label">Settings</span>
            <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform duration-300 ${settingsOpen ? "rotate-180" : ""}`} />
          </button>

          <motion.div
            initial={false}
            animate={{ height: settingsOpen ? "auto" : 0 }}
            transition={SPRING.panel}
            className="overflow-hidden"
          >
            <div className="space-y-1 py-1.5">
              {settingsItems.map(({ label, Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={onNavigate}
                  className={`sidebar-social-item ${pathname === href ? "text-primary" : ""}`}
                >
                  <span className="grid h-5 w-5 place-items-center">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </nav>

      <div className="mt-auto">
        <div className="space-y-2">
          <a href="#" className="flex h-9 items-center gap-3 rounded-control px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <CircleHelp className="h-4 w-4" />
            Help Center
          </a>
        </div>
      </div>
    </>
  );
}

type SidebarUser = {
  name?: string | null;
  image?: string | null;
};

export default function DashboardSidebar({
  children,
  user,
}: {
  children: ReactNode;
  user?: SidebarUser;
}) {
  const pathname = usePathname();
  const [socialOpen, setSocialOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const socialActive = pathname.startsWith("/dashboard/socials");
  const settingsActive = pathname.startsWith("/dashboard/settings");

  // Close the mobile drawer on route change so it never stays open behind
  // the page you just navigated to.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[#f6f8fb] text-slate-950 lg:block lg:h-screen">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-control text-slate-600 transition hover:bg-slate-50 active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="inline-flex min-w-0 items-center gap-2">
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-control">
            <Image
              src="/landing/final-center-logo.png"
              alt=""
              width={267}
              height={267}
              className="h-full w-full object-contain"
              priority
            />
          </span>
          <span className="truncate text-sm font-extrabold text-primary">AutoPilot</span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NotificationsButton />
          <Image
            src={user?.image || "/landing/testimonial-avatar.png"}
            alt={user?.name ? `${user.name} avatar` : "User avatar"}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 lg:h-screen">
        <aside className="hidden h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-5 py-6 lg:flex">
          <SidebarNavContent
            pathname={pathname}
            socialOpen={socialOpen}
            setSocialOpen={setSocialOpen}
            socialActive={socialActive}
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            settingsActive={settingsActive}
          />
        </aside>

        {children}
      </div>

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <ModalBackdrop
              role="presentation"
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={SPRING.panel}
              className="fixed inset-y-0 left-0 z-[95] flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 shadow-2xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
                className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-control text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarNavContent
                pathname={pathname}
                socialOpen={socialOpen}
                setSocialOpen={setSocialOpen}
                socialActive={socialActive}
                settingsOpen={settingsOpen}
                setSettingsOpen={setSettingsOpen}
                settingsActive={settingsActive}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
