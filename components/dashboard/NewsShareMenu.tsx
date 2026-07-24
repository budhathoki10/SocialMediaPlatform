"use client";

import { Check, Share2 } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";

import PressableButton from "@/components/motion/PressableButton";
import { SPRING } from "@/lib/motion/tokens";

const sharePlatforms = [
  { name: "LinkedIn", image: "/landing/linkedin.png", action: "linkedin", enabled: true },
  { name: "Instagram", image: "/landing/insta.png", action: "instagram", enabled: false },
  { name: "Facebook", image: "/landing/facebook.png", action: "facebook", enabled: false },
] as const;

type NewsShareMenuProps = {
  content: string;
};

export default function NewsShareMenu({ content }: NewsShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sharedPlatforms, setSharedPlatforms] = useState<string[]>([]);
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: globalThis.MouseEvent) {
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

  async function shareNews(platform: (typeof sharePlatforms)[number]["action"]) {
    const platformName = sharePlatforms.find((item) => item.action === platform)?.name || platform;
    const confirmed = window.confirm(`Share this news on ${platformName}?`);
    if (!confirmed) return;

    setSharingPlatform(platform);
    setShareError(null);

    try {
      const response = await fetch(`/api/share/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to share on ${platformName}.`);
      }

      setSharedPlatforms((current) => [...new Set([...current, platform])]);
    } catch (error) {
      setShareError(error instanceof Error ? error.message : `Unable to share on ${platformName}.`);
    } finally {
      setSharingPlatform(null);
    }
  }

  function toggleMenu(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setIsOpen((open) => !open);
  }

  return (
    <div ref={menuRef} onClick={(event) => event.stopPropagation()} className="relative inline-flex justify-end">
      <PressableButton
        type="button"
        onClick={toggleMenu}
        className="inline-flex h-8 items-center gap-2 rounded-control border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-primary hover:bg-primary hover:text-white"
        aria-label="Share news"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </PressableButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={SPRING.gentle}
            className="absolute bottom-10 right-0 z-20 w-44 rounded-card border border-slate-200 bg-white p-1.5 shadow-panel"
          >
            {sharePlatforms.map((platform) => {
              const hasBeenShared = sharedPlatforms.includes(platform.action);
              const isSharing = sharingPlatform === platform.action;

              return (
                <PressableButton
                  key={platform.name}
                  type="button"
                  disabled={!platform.enabled || hasBeenShared || isSharing}
                  onClick={() => void shareNews(platform.action)}
                  title={!platform.enabled ? `${platform.name} sharing is coming soon` : undefined}
                  className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-70"
                >
                  <Image src={platform.image} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                  <span className="flex-1">{platform.name}</span>
                  {!platform.enabled && <span className="text-[10px] text-slate-400">Coming soon</span>}
                  {platform.enabled && hasBeenShared && <Check className="h-3.5 w-3.5 text-emerald-600" aria-label="Posted" />}
                  {platform.enabled && isSharing && <span className="text-[10px] text-slate-500">Posting...</span>}
                </PressableButton>
              );
            })}
            {shareError && <p className="px-2 pb-1 pt-1 text-xs font-medium text-red-600">{shareError}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
