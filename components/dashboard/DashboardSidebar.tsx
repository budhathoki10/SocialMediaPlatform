"use client";

import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Settings,
  Share2,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { ModalBackdrop, ModalPanel } from "@/components/motion/Modal";
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
  { label: "WhatsApp", image: "/landing/whatsapps.png", href: "/dashboard/socials/whatsapp" },
  { label: "Instagram", image: "/landing/insta.png", href: "/dashboard/socials/instagram" },
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
  onLogoutClick,
  onNavigate,
}: {
  pathname: string;
  socialOpen: boolean;
  setSocialOpen: (updater: (open: boolean) => boolean) => void;
  socialActive: boolean;
  onLogoutClick: () => void;
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

        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={`sidebar-nav-item ${pathname === "/dashboard/settings" ? "sidebar-nav-item-active" : ""}`}
        >
          <SidebarIconTooltip label="Settings">
            <Settings />
          </SidebarIconTooltip>
          <span className="sidebar-nav-label">Settings</span>
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
          <button
            type="button"
            onClick={onLogoutClick}
            className="flex h-9 w-full items-center gap-3 rounded-control px-4 text-sm font-medium text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default function DashboardSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [socialOpen, setSocialOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const socialActive = pathname.startsWith("/dashboard/socials");

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

  async function confirmLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

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
      </header>

      <div className="flex min-h-0 flex-1 lg:h-screen">
        <aside className="hidden h-screen w-[248px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-5 py-6 lg:flex">
          <SidebarNavContent
            pathname={pathname}
            socialOpen={socialOpen}
            setSocialOpen={setSocialOpen}
            socialActive={socialActive}
            onLogoutClick={() => setLogoutOpen(true)}
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
                onLogoutClick={() => setLogoutOpen(true)}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {logoutOpen && (
          <ModalBackdrop
            role="presentation"
            onClick={() => !isLoggingOut && setLogoutOpen(false)}
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-md"
          >
            <ModalPanel
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-confirmation-title"
              aria-describedby="logout-confirmation-description"
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[410px] overflow-hidden rounded-[24px] border border-white/80 bg-white/95 shadow-[0_28px_80px_-20px_rgba(15,23,42,0.45)]"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-red-50/90 to-transparent" />
              <PressableButton
                type="button"
                onClick={() => setLogoutOpen(false)}
                disabled={isLoggingOut}
                aria-label="Close logout confirmation"
                className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </PressableButton>

              <div className="relative px-7 pb-7 pt-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-[6px] border-red-50 bg-red-100 text-red-600 shadow-sm">
                  <LogOut className="h-6 w-6" strokeWidth={2.25} />
                </div>
                <h2 id="logout-confirmation-title" className="mt-5 text-center text-[22px] font-extrabold tracking-tight text-slate-950">
                  Ready to log out?
                </h2>
                <p id="logout-confirmation-description" className="mx-auto mt-2 max-w-xs text-center text-sm leading-6 text-slate-500">
                  Your work is safely saved. You’ll need to sign in again to return to your dashboard.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <PressableButton
                    type="button"
                    onClick={() => setLogoutOpen(false)}
                    disabled={isLoggingOut}
                    className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </PressableButton>
                  <PressableButton
                    type="button"
                    onClick={() => void confirmLogout()}
                    disabled={isLoggingOut}
                    className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(239,68,68,0.8)] hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? "Logging out…" : "Log out"}
                  </PressableButton>
                </div>
              </div>
            </ModalPanel>
          </ModalBackdrop>
        )}
      </AnimatePresence>
    </main>
  );
}
