"use client";

import { Settings, User, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import PressableButton from "@/components/motion/PressableButton";
import { SPRING } from "@/lib/motion/tokens";

type MenuItem = { label: string; description: string; href: string; Icon: LucideIcon };

const MENU_ITEMS: MenuItem[] = [
  { label: "Profile", description: "Account, timezone, connections", href: "/dashboard/settings", Icon: User },
  { label: "Upgrade Plan", description: "Compare plans and pricing", href: "/dashboard/settings/billing", Icon: Zap },
];

const DEFAULT_BUTTON_CLASSNAME =
  "hidden h-9 w-9 place-items-center rounded-control text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 sm:grid";

/** Settings gear in the dashboard toolbar — opens a small menu instead of
 * navigating directly, since "Settings" now covers two destinations
 * (Profile, Upgrade Plan). Same trigger/outside-click idiom as
 * NotificationsButton so dashboard dropdowns behave consistently. */
export default function SettingsMenu({ buttonClassName = DEFAULT_BUTTON_CLASSNAME }: { buttonClassName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <PressableButton
        type="button"
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={buttonClassName}
      >
        <Settings className="h-5 w-5" />
      </PressableButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-label="Settings"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={SPRING.gentle}
            className="absolute right-0 top-11 z-30 w-64 overflow-hidden rounded-card border border-slate-200 bg-white p-1.5 shadow-panel"
          >
            {MENU_ITEMS.map(({ label, description, href, Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-control px-3 py-2.5 transition hover:bg-slate-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{label}</span>
                  <span className="block truncate text-xs text-slate-500">{description}</span>
                </span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
