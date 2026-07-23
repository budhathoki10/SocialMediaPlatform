"use client";

import { AlertCircle, Check, CheckCircle2, Minus, Plus, X as XIcon } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import PressableButton from "@/components/motion/PressableButton";
import { DURATION, MOTION_EASE, SPRING, STAGGER } from "@/lib/motion/tokens";

export type AutoReplySettingsData = {
  enabled: boolean;
  tone: "professional" | "friendly" | "creative" | "concise";
  aiSemanticAnalysis: boolean;
  followUpDelay: boolean;
  spamFiltering: boolean;
  platformPermissions: {
    linkedin: boolean;
    x: boolean;
    instagram: boolean;
    whatsapp: boolean;
  };
  contactFiltering: {
    mutualConnectionsOnly: boolean;
    verifiedProfiles: boolean;
  };
  keywordExclusions: string[];
  humanFallbackThreshold: number;
  responseStyle: {
    emojiUsage: "none" | "minimal" | "moderate";
    responseLength: "short" | "standard" | "detailed";
    greetingStyle: "first_name" | "generic";
    signOffStyle: string;
    customSignOff: string;
    linkCtaEnabled: boolean;
    maxRepliesPerContact: number;
    businessHoursAware: boolean;
    businessHoursStart: string;
    businessHoursEnd: string;
  };
};

export type AutoReplyLogRow = {
  id: string;
  platform: string;
  reply: string;
  createdAt: string | null;
};

const DEFAULT_SETTINGS: AutoReplySettingsData = {
  enabled: false,
  tone: "professional",
  aiSemanticAnalysis: true,
  followUpDelay: true,
  spamFiltering: true,
  platformPermissions: { linkedin: false, x: false, instagram: false, whatsapp: false },
  contactFiltering: { mutualConnectionsOnly: false, verifiedProfiles: false },
  keywordExclusions: ["pricing", "refund", "legal"],
  humanFallbackThreshold: 65,
  responseStyle: {
    emojiUsage: "minimal",
    responseLength: "standard",
    greetingStyle: "first_name",
    signOffStyle: "team_name",
    customSignOff: "AutoPilot Support Team",
    linkCtaEnabled: true,
    maxRepliesPerContact: 1,
    businessHoursAware: false,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
  },
};

function cloneSettings(value: AutoReplySettingsData): AutoReplySettingsData {
  return {
    ...value,
    platformPermissions: { ...value.platformPermissions },
    contactFiltering: { ...value.contactFiltering },
    keywordExclusions: [...value.keywordExclusions],
    responseStyle: { ...value.responseStyle },
  };
}

function timeAgo(value: string | null) {
  if (!value) return "";

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

/* Layout primitives -------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER.base, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: MOTION_EASE.outExpo } },
};

const inputClassName =
  "h-10 rounded-control border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10";

const timeInputClassName =
  "h-8 w-[8.5rem] rounded-control border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 outline-none transition [&::-webkit-calendar-picker-indicator]:h-3 [&::-webkit-calendar-picker-indicator]:w-3 [&::-webkit-calendar-picker-indicator]:opacity-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <PressableButton
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition-colors duration-300 ${
        checked ? "bg-primary" : "bg-slate-200"
      }`}
    >
      <motion.span
        animate={{ x: checked ? 20 : 0 }}
        transition={SPRING.press}
        className="block h-4 w-4 rounded-full bg-white shadow"
      />
    </PressableButton>
  );
}

/** Segmented control: one sliding chip inside a neutral track — no per-option borders. */
function Segmented<T extends string>({
  layoutId,
  options,
  value,
  onChange,
  columns,
}: {
  layoutId: string;
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Grid column count. Defaults to one row (options.length) — pass a smaller
   * number to wrap onto multiple rows in narrow containers. */
  columns?: number;
}) {
  return (
    <div
      className="grid gap-1 rounded-control bg-slate-100 p-1"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`relative min-w-0 rounded-[7px] px-3 py-2 text-center text-sm font-semibold transition ${
              active ? "text-primary" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING.gentle}
                className="absolute inset-0 rounded-[7px] bg-white shadow-sm ring-1 ring-slate-200/70"
              />
            )}
            <span className="relative block truncate">{option.label}</span>
            {option.hint ? <span className="relative block truncate text-xs font-normal text-slate-400">{option.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section variants={itemVariants} className={`rounded-card border border-slate-200 bg-white p-6 shadow-card ${className}`}>
      {children}
    </motion.section>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p> : null}
    </div>
  );
}

/** Label + description on the left, a compact control on the right. One line on wide screens. */
function Row({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-[60%]">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p> : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/** Label + description on top, a full-width control below. For controls too wide for one line. */
function FullRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RowList({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-slate-100">{children}</div>;
}

/* Static data --------------------------------------------------------------- */

const TONE_OPTIONS: { value: AutoReplySettingsData["tone"]; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "creative", label: "Creative" },
  { value: "concise", label: "Concise" },
];

const PLATFORM_ROWS = [
  { key: "linkedin" as const, label: "LinkedIn", image: "/landing/linkedin.png", subtitle: "Comments and message replies" },
  { key: "x" as const, label: "X (Twitter)", image: null, subtitle: "Mentions and replies only" },
  { key: "instagram" as const, label: "Instagram", image: "/landing/insta.png", subtitle: "Direct messages and comments" },
  { key: "whatsapp" as const, label: "WhatsApp", image: "/landing/whatsapp.png", subtitle: "Business account messages" },
];

const EMOJI_OPTIONS: { value: AutoReplySettingsData["responseStyle"]["emojiUsage"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "moderate", label: "Moderate" },
];

const LENGTH_OPTIONS: {
  value: AutoReplySettingsData["responseStyle"]["responseLength"];
  label: string;
  hint: string;
}[] = [
  { value: "short", label: "Short", hint: "1-2 sentences" },
  { value: "standard", label: "Standard", hint: "3-4 sentences" },
  { value: "detailed", label: "Detailed", hint: "5+ sentences" },
];

const GREETING_OPTIONS: { value: AutoReplySettingsData["responseStyle"]["greetingStyle"]; label: string }[] = [
  { value: "first_name", label: "Use their first name" },
  { value: "generic", label: "Generic greeting" },
];

export default function AutoReplySettingsPanel({
  initialSettings,
  initialLogs,
  connectedPlatforms,
}: {
  initialSettings: AutoReplySettingsData | null;
  initialLogs: AutoReplyLogRow[];
  connectedPlatforms: string[];
}) {
  const baseline = initialSettings || DEFAULT_SETTINGS;
  const [settings, setSettings] = useState<AutoReplySettingsData>(() => cloneSettings(baseline));
  const [savedSettings, setSavedSettings] = useState<AutoReplySettingsData>(() => cloneSettings(baseline));
  const [keywordDraft, setKeywordDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const logs = initialLogs;
  const connectedPlatformRows = PLATFORM_ROWS.filter((row) => connectedPlatforms.includes(row.key));

  useEffect(() => () => clearTimeout(savedTimeoutRef.current), []);

  const isDirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);

  function updateEnabled(enabled: boolean) {
    setSettings((prev) => ({ ...prev, enabled }));
  }

  function updateTone(tone: AutoReplySettingsData["tone"]) {
    setSettings((prev) => ({ ...prev, tone }));
  }

  function updateFlag(key: "aiSemanticAnalysis" | "followUpDelay" | "spamFiltering", value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function updatePlatform(key: keyof AutoReplySettingsData["platformPermissions"], value: boolean) {
    setSettings((prev) => ({ ...prev, platformPermissions: { ...prev.platformPermissions, [key]: value } }));
  }

  function updateContactFiltering(key: keyof AutoReplySettingsData["contactFiltering"], value: boolean) {
    setSettings((prev) => ({ ...prev, contactFiltering: { ...prev.contactFiltering, [key]: value } }));
  }

  function addKeyword() {
    const word = keywordDraft.trim();
    if (!word || settings.keywordExclusions.includes(word)) return;

    setSettings((prev) => ({ ...prev, keywordExclusions: [...prev.keywordExclusions, word] }));
    setKeywordDraft("");
  }

  function removeKeyword(word: string) {
    setSettings((prev) => ({ ...prev, keywordExclusions: prev.keywordExclusions.filter((entry) => entry !== word) }));
  }

  function updateThreshold(value: number) {
    setSettings((prev) => ({ ...prev, humanFallbackThreshold: value }));
  }

  function updateResponseStyle(patch: Partial<AutoReplySettingsData["responseStyle"]>) {
    setSettings((prev) => ({ ...prev, responseStyle: { ...prev.responseStyle, ...patch } }));
  }

  function discardChanges() {
    setSettings(cloneSettings(savedSettings));
    setSaveError("");
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/auto-reply/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to save settings.");
      }

      const nextSettings = cloneSettings(data.settings || settings);
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
      setJustSaved(true);
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="pb-24">
      <motion.div variants={itemVariants} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Automation</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Auto-Reply</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Configure how AutoPilot responds to messages and comments across LinkedIn, X, Instagram, and WhatsApp.
          </p>
        </div>

        <div className="inline-flex items-center gap-3 rounded-control border border-slate-200 bg-white px-4 py-2.5 shadow-card">
          <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
            {settings.enabled && (
              <motion.span
                aria-hidden="true"
                className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <span
              className={`relative h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                settings.enabled ? "bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.6)]" : "bg-red-500"
              }`}
            />
          </span>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">{settings.enabled ? "Automation on" : "Automation off"}</p>
            <p className="text-[11px] text-slate-400">Applies to all connected platforms</p>
          </div>
          <Toggle checked={settings.enabled} onChange={updateEnabled} label="Enable auto-reply automation" />
        </div>
      </motion.div>

      <div
        className={`mt-6 grid gap-5 transition-all duration-[350ms] ease-out lg:grid-cols-[360px_1fr] lg:items-start ${
          settings.enabled ? "opacity-100 blur-[0px]" : "pointer-events-none select-none opacity-55 blur-[3px]"
        }`}
        inert={!settings.enabled}
        aria-hidden={!settings.enabled}
      >
        <div className="space-y-5 lg:sticky lg:top-6">
          <Card>
            <SectionHeader title="Reply behavior" description="The personality and judgment auto-replies use." />
            <RowList>
              <FullRow label="Voice &amp; tone">
                <Segmented layoutId="tone-pill" options={TONE_OPTIONS} value={settings.tone} onChange={updateTone} columns={2} />
              </FullRow>
              <Row
                label="AI semantic analysis"
                description="Understand intent instead of matching keywords."
                control={
                  <Toggle
                    checked={settings.aiSemanticAnalysis}
                    onChange={(value) => updateFlag("aiSemanticAnalysis", value)}
                    label="AI semantic analysis"
                  />
                }
              />
              <Row
                label="Follow-up delay"
                description="Wait 30s–2m before sending so replies feel human."
                control={
                  <Toggle
                    checked={settings.followUpDelay}
                    onChange={(value) => updateFlag("followUpDelay", value)}
                    label="Follow-up delay"
                  />
                }
              />
              <Row
                label="Spam filtering"
                description="Withhold replies to messages flagged as spam."
                control={
                  <Toggle
                    checked={settings.spamFiltering}
                    onChange={(value) => updateFlag("spamFiltering", value)}
                    label="Spam filtering"
                  />
                }
              />
            </RowList>
          </Card>

          <Card>
            <SectionHeader title="Recent activity" description="The last 2 replies AutoPilot sent on your behalf." />
            {logs.length === 0 ? (
              <p className="pt-4 text-sm text-slate-400">No auto-replies sent yet.</p>
            ) : (
              <RowList>
                {logs.map((log) => (
                  <div key={log.id} className="py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold capitalize text-slate-600">{log.platform}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Sent {timeAgo(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-700">&ldquo;{log.reply}&rdquo;</p>
                  </div>
                ))}
              </RowList>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeader title="Platform access" description="Choose which connected accounts auto-reply may act on." />
            {connectedPlatformRows.length === 0 ? (
              <p className="pt-4 text-sm text-slate-400">
                No social accounts connected yet. Connect one from Socials in the sidebar to enable auto-reply on it.
              </p>
            ) : (
              <RowList>
                {connectedPlatformRows.map(({ key, label, image, subtitle }) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-slate-50 ring-1 ring-slate-200">
                        {image ? (
                          <Image src={image} alt="" width={20} height={20} className="h-4 w-4 object-contain" />
                        ) : (
                          <XIcon className="h-4 w-4 text-slate-500" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500">{subtitle}</p>
                      </div>
                    </div>
                    <Toggle
                      checked={settings.platformPermissions[key]}
                      onChange={(value) => updatePlatform(key, value)}
                      label={`Enable auto-reply on ${label}`}
                    />
                  </div>
                ))}
              </RowList>
            )}
          </Card>

          <Card>
            <SectionHeader title="Filtering &amp; safety" description="Guardrails that decide who gets a reply, and when to step back." />
            <RowList>
              <Row
                label="Mutual connections only"
                description="Only reply to people already in your network."
                control={
                  <Toggle
                    checked={settings.contactFiltering.mutualConnectionsOnly}
                    onChange={(value) => updateContactFiltering("mutualConnectionsOnly", value)}
                    label="Mutual connections only"
                  />
                }
              />
              <Row
                label="Verified profiles only"
                description="Only reply to accounts with a verified badge."
                control={
                  <Toggle
                    checked={settings.contactFiltering.verifiedProfiles}
                    onChange={(value) => updateContactFiltering("verifiedProfiles", value)}
                    label="Verified profiles only"
                  />
                }
              />
              <FullRow label="Excluded keywords" description="Messages containing these words are never auto-replied to.">
                <div className="flex flex-wrap items-center gap-2">
                  <AnimatePresence initial={false}>
                    {settings.keywordExclusions.map((word) => (
                      <motion.span
                        key={word}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={SPRING.press}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        {word}
                        <button
                          type="button"
                          onClick={() => removeKeyword(word)}
                          aria-label={`Remove ${word}`}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      addKeyword();
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-3.5 pr-1 shadow-sm transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
                  >
                    <input
                      value={keywordDraft}
                      onChange={(event) => setKeywordDraft(event.target.value)}
                      placeholder="Add a word, press Enter"
                      aria-label="Add excluded keyword"
                      className="h-6 w-32 bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-400 sm:w-44"
                    />
                    <PressableButton
                      type="submit"
                      disabled={!keywordDraft.trim()}
                      aria-label="Add keyword"
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </PressableButton>
                  </form>
                </div>
              </FullRow>
              <FullRow
                label="Human fallback threshold"
                description="Below this confidence score, AutoPilot hands the message to you instead of replying."
              >
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.humanFallbackThreshold}
                    onChange={(event) => updateThreshold(Number(event.target.value))}
                    aria-label="Human fallback confidence threshold"
                    style={{
                      background: `linear-gradient(to right, var(--color-primary) ${settings.humanFallbackThreshold}%, #e2e8f0 ${settings.humanFallbackThreshold}%)`,
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-primary"
                  />
                  <span className="w-12 shrink-0 text-right text-sm font-bold text-slate-700">
                    {settings.humanFallbackThreshold}%
                  </span>
                </div>
              </FullRow>
            </RowList>
          </Card>

          <Card>
            <SectionHeader title="Response style" description="How each reply reads once it's written." />
            <RowList>
              <FullRow label="Emoji usage">
                <Segmented
                  layoutId="emoji-pill"
                  options={EMOJI_OPTIONS}
                  value={settings.responseStyle.emojiUsage}
                  onChange={(value) => updateResponseStyle({ emojiUsage: value })}
                />
              </FullRow>
              <FullRow label="Response length">
                <Segmented
                  layoutId="length-pill"
                  options={LENGTH_OPTIONS}
                  value={settings.responseStyle.responseLength}
                  onChange={(value) => updateResponseStyle({ responseLength: value })}
                />
              </FullRow>
              <FullRow label="Greeting style">
                <Segmented
                  layoutId="greeting-pill"
                  options={GREETING_OPTIONS}
                  value={settings.responseStyle.greetingStyle}
                  onChange={(value) => updateResponseStyle({ greetingStyle: value })}
                />
              </FullRow>
              <Row
                label="Sign-off style"
                description="What every reply ends with."
                control={
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={settings.responseStyle.signOffStyle}
                      onChange={(event) => updateResponseStyle({ signOffStyle: event.target.value })}
                      aria-label="Sign-off style"
                      className={`${inputClassName} shrink-0`}
                    >
                      <option value="team_name">Team name</option>
                      <option value="personal_name">Personal name</option>
                      <option value="none">No sign-off</option>
                    </select>
                    <input
                      value={settings.responseStyle.customSignOff}
                      onChange={(event) => updateResponseStyle({ customSignOff: event.target.value })}
                      disabled={settings.responseStyle.signOffStyle === "none"}
                      aria-label="Custom sign-off text"
                      title={settings.responseStyle.customSignOff}
                      placeholder="Sign-off text"
                      className={`${inputClassName} w-56 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                    />
                  </div>
                }
              />
              <Row
                label="Link/CTA inclusion"
                description="Allow links to appear in auto-replies."
                control={
                  <Toggle
                    checked={settings.responseStyle.linkCtaEnabled}
                    onChange={(value) => updateResponseStyle({ linkCtaEnabled: value })}
                    label="Toggle link/CTA inclusion"
                  />
                }
              />
              <Row
                label="Max auto replies and AI drafts per user"
                description="Daily auto-reply and AI draft limit for the same person."
                control={
                  <div className="flex items-center gap-3">
                    <PressableButton
                      type="button"
                      aria-label="Decrease max replies per contact"
                      disabled={settings.responseStyle.maxRepliesPerContact <= 1}
                      onClick={() =>
                        updateResponseStyle({
                          maxRepliesPerContact: Math.max(1, settings.responseStyle.maxRepliesPerContact - 1),
                        })
                      }
                      className="grid h-8 w-8 place-items-center rounded-control border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </PressableButton>
                    <span className="w-4 text-center text-sm font-bold text-slate-800">
                      {settings.responseStyle.maxRepliesPerContact}
                    </span>
                    <PressableButton
                      type="button"
                      aria-label="Increase max replies per contact"
                      onClick={() =>
                        updateResponseStyle({
                          maxRepliesPerContact: Math.min(20, settings.responseStyle.maxRepliesPerContact + 1),
                        })
                      }
                      className="grid h-8 w-8 place-items-center rounded-control border border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </PressableButton>
                  </div>
                }
              />
              <Row
                label="Business hours awareness"
                description="Reply on a delay outside your set business hours."
                control={
                  <Toggle
                    checked={settings.responseStyle.businessHoursAware}
                    onChange={(value) => updateResponseStyle({ businessHoursAware: value })}
                    label="Toggle business hours awareness"
                  />
                }
              />
              <div
                className={`flex flex-wrap items-center gap-3 pb-4 transition-opacity duration-300 ${
                  settings.responseStyle.businessHoursAware ? "opacity-100" : "pointer-events-none opacity-50"
                }`}
                inert={!settings.responseStyle.businessHoursAware}
              >
                <label className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">From</span>
                  <input
                    type="time"
                    value={settings.responseStyle.businessHoursStart}
                    onChange={(event) => updateResponseStyle({ businessHoursStart: event.target.value })}
                    aria-label="Business hours start time"
                    className={timeInputClassName}
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">To</span>
                  <input
                    type="time"
                    value={settings.responseStyle.businessHoursEnd}
                    onChange={(event) => updateResponseStyle({ businessHoursEnd: event.target.value })}
                    aria-label="Business hours end time"
                    className={timeInputClassName}
                  />
                </label>
              </div>
            </RowList>
          </Card>
        </div>
        </div>

      <AnimatePresence>
        {(isDirty || justSaved) && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={SPRING.gentle}
            className="sticky bottom-6 z-20 mt-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-slate-200 bg-white px-6 py-4 shadow-panel">
              {isDirty ? (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">You have unsaved changes</p>
                      <p className="text-xs text-slate-500">
                        {saveError || "Save to apply them to your live auto-reply settings."}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PressableButton
                      type="button"
                      onClick={discardChanges}
                      disabled={saving}
                      className="h-10 rounded-control px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                    >
                      Discard
                    </PressableButton>
                    <PressableButton
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-5 text-sm font-bold text-white shadow-card transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </PressableButton>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">All changes saved</p>
                    <p className="text-xs text-slate-500">Your auto-reply settings are up to date.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
