"use client";

import { LogOut, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import PressableButton from "@/components/motion/PressableButton";

export default function LogoutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function confirmLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-description"
        className="w-full max-w-md rounded-panel border border-slate-200 bg-white p-6 shadow-panel"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
            <LogOut className="h-5 w-5" />
          </span>
          <PressableButton
            type="button"
            onClick={() => router.back()}
            disabled={isLoggingOut}
            aria-label="Cancel logout"
            className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </PressableButton>
        </div>

        <h1 id="logout-title" className="mt-5 text-xl font-bold text-slate-950">
          Log out of AutoPilot?
        </h1>
        <p id="logout-description" className="mt-2 text-sm leading-6 text-slate-500">
          Are you sure you want to log out? You will need to sign in again to access your dashboard.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <PressableButton
            type="button"
            onClick={() => router.back()}
            disabled={isLoggingOut}
            className="h-10 rounded-md px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
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
            {isLoggingOut ? "Logging out…" : "Yes, log out"}
          </PressableButton>
        </div>
      </section>
    </main>
  );
}
