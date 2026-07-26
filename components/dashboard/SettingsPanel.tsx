"use client";

import { AlertTriangle, Camera, Check, LogOut, Receipt, X, Zap } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";

import EmptyState from "@/components/dashboard/EmptyState";
import { ModalBackdrop, ModalPanel } from "@/components/motion/Modal";
import PressableButton from "@/components/motion/PressableButton";
import PressableLink from "@/components/motion/PressableLink";
import HoverCard from "@/components/motion/HoverCard";

export type SettingsData = {
  profile: {
    name: string;
    email: string;
    avatarUrl: string | null;
    plan: string;
    timezone: string;
  };
  connectedAccounts: {
    platform: string;
    connected: boolean;
    username: string | null;
    connectedAt: string | null;
    facebookPageLinked?: boolean;
  }[];
  billing: {
    postsThisMonth: number;
    postCap: number;
  };
};

const DEFAULT_SETTINGS: SettingsData = {
  profile: { name: "User", email: "", avatarUrl: null, plan: "free", timezone: "Asia/Kathmandu" },
  connectedAccounts: [
    { platform: "github", connected: false, username: null, connectedAt: null },
    { platform: "linkedin", connected: false, username: null, connectedAt: null },
    { platform: "instagram", connected: false, username: null, connectedAt: null, facebookPageLinked: false },
  ],
  billing: { postsThisMonth: 0, postCap: 5 },
};

const platformImages: Record<string, string> = {
  github: "/landing/githubs.png",
  linkedin: "/landing/linkedin.png",
  instagram: "/landing/insta.png",
};

const platformNames: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

const disconnectEndpoints: Record<string, string> = {
  github: "/api/auth/github/disconnect",
  linkedin: "/api/auth/linkedin/disconnect",
  instagram: "/api/auth/instagram/disconnect",
};

function getTimeZoneOptions() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["Asia/Kathmandu", "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Kolkata"];
  }
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border border-slate-200 bg-white p-5 shadow-card ${className}`}>{children}</section>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
        connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}

type PendingAction = { type: "disconnect"; platform: string } | { type: "disconnectAll" } | { type: "deleteAccount" };

function ConfirmDialog({
  action,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  action: PendingAction | null;
  loading: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typedValue, setTypedValue] = useState("");

  const content = useMemo(() => {
    if (!action) return null;

    if (action.type === "disconnect") {
      const label = platformNames[action.platform] || action.platform;
      return {
        title: `Disconnect ${label}?`,
        description: `AutoPilot will stop reading, posting, and replying through your ${label} connection until you reconnect it.`,
        confirmLabel: "Disconnect",
        requireTypedConfirmation: null as string | null,
      };
    }

    if (action.type === "disconnectAll") {
      return {
        title: "Disconnect all platforms?",
        description: "This immediately disconnects every connected account. Automation stops on all of them until you reconnect each one individually.",
        confirmLabel: "Disconnect all",
        requireTypedConfirmation: null as string | null,
      };
    }

    return {
      title: "Delete your account?",
      description: "This permanently deletes your AutoPilot account and everything tied to it. This cannot be undone.",
      confirmLabel: "Delete account",
      requireTypedConfirmation: "DELETE",
    };
  }, [action]);

  const canConfirm = !content?.requireTypedConfirmation || typedValue === content.requireTypedConfirmation;

  function handleCancel() {
    setTypedValue("");
    onCancel();
  }

  function handleConfirm() {
    setTypedValue("");
    onConfirm();
  }

  return (
    <AnimatePresence>
      {content ? (
        <ModalBackdrop
          onClick={handleCancel}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/10 p-4 backdrop-blur-[2px]"
        >
          <ModalPanel
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[440px] rounded-panel border border-slate-200 bg-white p-7 shadow-panel"
          >
            <PressableButton
              type="button"
              onClick={handleCancel}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </PressableButton>

            <span className="grid h-11 w-11 place-items-center rounded-control bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-950">{content.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{content.description}</p>

            {content.requireTypedConfirmation ? (
              <div className="mt-4">
                <label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                  Type {content.requireTypedConfirmation} to confirm
                </label>
                <input
                  value={typedValue}
                  onChange={(event) => setTypedValue(event.target.value)}
                  placeholder={content.requireTypedConfirmation}
                  className="mt-2 h-10 w-full rounded-control border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                />
              </div>
            ) : null}

            {error ? <p className="mt-3 text-xs font-semibold text-red-600">{error}</p> : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <PressableButton
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="inline-flex h-10 items-center justify-center rounded-control border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </PressableButton>
              <PressableButton
                type="button"
                disabled={!canConfirm || loading}
                onClick={handleConfirm}
                className="inline-flex h-10 items-center justify-center rounded-control bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200"
              >
                {loading ? "Working..." : content.confirmLabel}
              </PressableButton>
            </div>
          </ModalPanel>
        </ModalBackdrop>
      ) : null}
    </AnimatePresence>
  );
}

export default function SettingsPanel({ initialSettings }: { initialSettings: SettingsData | null }) {
  const baseline = initialSettings || DEFAULT_SETTINGS;
  const [timezone, setTimezone] = useState(baseline.profile.timezone);
  const [savedTimezone, setSavedTimezone] = useState(baseline.profile.timezone);
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [timezoneError, setTimezoneError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const timeZoneOptions = useMemo(() => {
    const options = getTimeZoneOptions();
    // Intl.supportedValuesOf("timeZone") only returns canonical IANA names —
    // e.g. it has "Asia/Katmandu", not the "Asia/Kathmandu" this app stores
    // as its default (lib/models.js KATHMANDU_TIME_ZONE). Both resolve to the
    // same real timezone, but a <select> whose value isn't one of its own
    // <option>s silently falls back to displaying the first option instead.
    return options.includes(savedTimezone) ? options : [savedTimezone, ...options];
  }, [savedTimezone]);
  const isTimezoneDirty = timezone !== savedTimezone;

  const [connectedAccounts, setConnectedAccounts] = useState(baseline.connectedAccounts);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const hasAnyConnection = connectedAccounts.some((account) => account.connected);
  const usagePercent = Math.min(100, Math.round((baseline.billing.postsThisMonth / baseline.billing.postCap) * 100));

  async function handleSaveTimezone() {
    setSavingTimezone(true);
    setTimezoneError("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to save timezone.");
      }

      setSavedTimezone(timezone);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      setTimezoneError(error instanceof Error ? error.message : "Unable to save timezone.");
    } finally {
      setSavingTimezone(false);
    }
  }

  async function disconnectPlatform(platform: string) {
    const response = await fetch(disconnectEndpoints[platform], { method: "POST" });

    if (!response.ok) {
      throw new Error(`Unable to disconnect ${platformNames[platform] || platform}.`);
    }

    setConnectedAccounts((prev) =>
      prev.map((account) =>
        account.platform === platform
          ? { ...account, connected: false, username: null, facebookPageLinked: false }
          : account,
      ),
    );
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;

    setActionLoading(true);
    setActionError("");

    try {
      if (pendingAction.type === "disconnect") {
        await disconnectPlatform(pendingAction.platform);
      } else if (pendingAction.type === "disconnectAll") {
        await Promise.all(
          connectedAccounts.filter((account) => account.connected).map((account) => disconnectPlatform(account.platform)),
        );
      } else {
        // TODO: wire to a real account-deletion route + flow once one exists.
        // Intentionally not deleting anything yet — see plan for context.
        alert("Account deletion isn't available yet — we're still building this. Contact support if you need help.");
      }

      setPendingAction(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Account */}
      <Card>
        <SectionHeader title="Account" description="Your profile is synced from Google — name, email, and photo aren't editable here." />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="relative shrink-0">
            <Image
              src={baseline.profile.avatarUrl || "/landing/testimonial-avatar.png"}
              alt={`${baseline.profile.name} avatar`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-white"
            />
            <PressableButton
              type="button"
              disabled
              title="Synced from your Google account"
              aria-label="Change profile photo — synced from Google"
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm disabled:cursor-not-allowed"
            >
              <Camera className="h-3.5 w-3.5" />
            </PressableButton>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900">{baseline.profile.name}</p>
            <p className="truncate text-sm text-slate-500">{baseline.profile.email}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Synced from Google</p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Timezone</p>
          <p className="mt-1 text-xs text-slate-500">Used for greetings and scheduling times across AutoPilot.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-control border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            >
              {timeZoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <PressableButton
              type="button"
              disabled={!isTimezoneDirty || savingTimezone}
              onClick={handleSaveTimezone}
              className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {justSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : savingTimezone ? (
                "Saving..."
              ) : (
                "Save"
              )}
            </PressableButton>
          </div>
          {timezoneError ? <p className="mt-2 text-xs font-semibold text-red-600">{timezoneError}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">Signed in as {baseline.profile.email}</p>
          <PressableButton
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-2 text-sm font-bold text-red-600 transition hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </PressableButton>
        </div>
      </Card>

      {/* Connected Platforms */}
      <Card>
        <SectionHeader
          title="Connected Platforms"
          description="GitHub, LinkedIn, and Instagram are the platforms AutoPilot can connect to today."
        />
        <div className="mt-4 space-y-3">
          {connectedAccounts.map((account) => (
            <HoverCard
              key={account.platform}
              liftPx={2}
              className="rounded-control border border-slate-200 bg-slate-50/60 p-3.5 transition hover:bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-slate-200 bg-white">
                    <Image
                      src={platformImages[account.platform]}
                      alt=""
                      width={20}
                      height={20}
                      className="h-4 w-4 object-contain"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{platformNames[account.platform]}</p>
                    <p className="truncate text-xs text-slate-500">
                      {account.connected ? account.username || "Connected" : "Not connected"}
                    </p>
                    {account.platform === "instagram" && account.connected ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {account.facebookPageLinked ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Linked to Facebook Page
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Not linked to a Facebook Page
                            </span>
                            <PressableLink href="/onboarding" className="text-[10px] font-bold text-primary hover:text-primary-hover">
                              Fix connection
                            </PressableLink>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill connected={account.connected} />
                  {account.connected ? (
                    <PressableButton
                      type="button"
                      onClick={() => setPendingAction({ type: "disconnect", platform: account.platform })}
                      className="text-xs font-bold text-red-600 transition hover:text-red-700"
                    >
                      Disconnect
                    </PressableButton>
                  ) : (
                    <PressableLink href="/onboarding" className="text-xs font-bold text-primary hover:text-primary-hover">
                      Connect
                    </PressableLink>
                  )}
                </div>
              </div>
            </HoverCard>
          ))}
        </div>
      </Card>

      {/* Billing & Plan */}
      <Card>
        <SectionHeader title="Billing & Plan" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-control border border-primary/20 bg-primary-tint px-4 py-4">
          <div>
            <p className="text-sm font-bold capitalize text-primary">{baseline.profile.plan || "free"} plan</p>
            <p className="mt-1 text-xs text-slate-600">Unlock advanced automation tools and analytics.</p>
          </div>
          <PressableButton
            type="button"
            onClick={() => alert("Billing is coming soon — we're still building this.")}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-control bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </PressableButton>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Posts this month</span>
            <span>
              {baseline.billing.postsThisMonth} / {baseline.billing.postCap}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Usage shown for reference — plan limits aren&apos;t enforced yet.</p>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <EmptyState
            icon={Receipt}
            title="No billing history"
            description="Payment methods and invoices will appear here once billing is live."
            className="min-h-32"
          />
        </div>
      </Card>

      {/* Danger Zone */}
      <section className="rounded-card border border-red-200 bg-red-50/40 p-5 shadow-card">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
        </div>
        <p className="mt-1 text-xs text-red-600/80">These actions are immediate and hard to undo.</p>

        <div className="mt-4 divide-y divide-red-100">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Disconnect all platforms</p>
              <p className="mt-0.5 text-xs text-slate-500">Immediately disconnects GitHub, LinkedIn, and Instagram.</p>
            </div>
            <PressableButton
              type="button"
              disabled={!hasAnyConnection}
              onClick={() => setPendingAction({ type: "disconnectAll" })}
              className="inline-flex h-9 shrink-0 items-center rounded-control border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Disconnect all
            </PressableButton>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Delete account</p>
              <p className="mt-0.5 text-xs text-slate-500">Permanently deletes your AutoPilot account and all data.</p>
            </div>
            <PressableButton
              type="button"
              onClick={() => setPendingAction({ type: "deleteAccount" })}
              className="inline-flex h-9 shrink-0 items-center rounded-control bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Delete account
            </PressableButton>
          </div>
        </div>
      </section>

      <ConfirmDialog
        action={pendingAction}
        loading={actionLoading}
        error={actionError}
        onCancel={() => {
          setPendingAction(null);
          setActionError("");
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
