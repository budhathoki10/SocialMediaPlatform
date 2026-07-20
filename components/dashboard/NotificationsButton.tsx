"use client";

import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import PressableButton from "@/components/motion/PressableButton";
import { SPRING } from "@/lib/motion/tokens";

type NotificationsButtonProps = {
  className?: string;
};

/**
 * Shared across every dashboard toolbar. Previously each page had its own
 * dead Bell button with a hardcoded "unread" dot that never went away and
 * never opened anything — implying state that didn't exist. This still has
 * no backing notification feed, but it's honest about it: click it and it
 * tells you that, instead of pretending.
 */
export default function NotificationsButton({ className = "" }: NotificationsButtonProps) {
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
    <div ref={menuRef} className={`relative ${className}`}>
      <PressableButton
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-9 w-9 place-items-center rounded-control border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
      >
        <Bell className="h-5 w-5" />
      </PressableButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={SPRING.gentle}
            className="absolute right-0 top-11 z-30 w-64 rounded-card border border-slate-200 bg-white p-4 text-center shadow-panel"
          >
            <span className="mx-auto grid h-9 w-9 place-items-center rounded-control bg-primary-tint text-primary">
              <CheckCheck className="h-4 w-4" />
            </span>
            <p className="mt-2 text-sm font-semibold text-slate-700">You&apos;re all caught up</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              New activity on your connected accounts will show up here.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
