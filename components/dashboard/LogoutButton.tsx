"use client";

import { LogOut, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { AnimatePresence } from "motion/react";
import { useState, type ReactNode } from "react";

import { ModalBackdrop, ModalPanel } from "@/components/motion/Modal";
import PressableButton from "@/components/motion/PressableButton";

/**
 * Trigger + confirmation modal for signing out, self-contained so every
 * place logout can be started from (sidebar nav, settings page, ...) shares
 * one dialog instead of each call site wiring its own open/loading state
 * and duplicating the confirm markup.
 */
export default function LogoutButton({ className, children }: { className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function confirmLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <AnimatePresence>
        {open && (
          <ModalBackdrop
            role="presentation"
            onClick={() => !isLoggingOut && setOpen(false)}
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-md"
          >
            <ModalPanel
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-confirmation-title"
              aria-describedby="logout-confirmation-description"
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[360px] rounded-panel border border-slate-200 bg-white p-6 shadow-panel"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
                  <LogOut className="h-5 w-5" />
                </span>
                <PressableButton
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isLoggingOut}
                  aria-label="Close logout confirmation"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </PressableButton>
              </div>

              <h2 id="logout-confirmation-title" className="mt-5 text-xl font-bold text-slate-950">
                Ready to log out?
              </h2>
              <p id="logout-confirmation-description" className="mt-2 text-sm leading-6 text-slate-500">
                You’ll need to sign in again to access your dashboard.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <PressableButton
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isLoggingOut}
                  className="h-10 rounded-md px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </PressableButton>
                <PressableButton
                  type="button"
                  onClick={() => void confirmLogout()}
                  disabled={isLoggingOut}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Logging out…" : "Log out"}
                </PressableButton>
              </div>
            </ModalPanel>
          </ModalBackdrop>
        )}
      </AnimatePresence>
    </>
  );
}
