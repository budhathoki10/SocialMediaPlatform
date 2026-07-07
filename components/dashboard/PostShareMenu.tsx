"use client";

import { Check, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const sharePlatforms = [
  { name: "LinkedIn", image: "/landing/linkedin.png", action: "linkedin" },
  { name: "Instagram", image: "/landing/insta.png", action: "instagram" },
  { name: "Facebook", image: "/landing/facebook.png", action: "facebook" },
] as const;

type PostShareMenuProps = {
  postId: string;
  initialSharedPlatforms: string[];
  onPostPublished: () => void;
};

export default function PostShareMenu({ postId, initialSharedPlatforms, onPostPublished }: PostShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sharedPlatforms, setSharedPlatforms] = useState(initialSharedPlatforms);
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
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

  async function sharePost(platform: (typeof sharePlatforms)[number]["action"]) {
    const platformName = sharePlatforms.find((item) => item.action === platform)?.name || platform;
    const confirmed = window.confirm(`Are you sure you want to share this post on ${platformName}?`);

    if (!confirmed) return;

    setSharingPlatform(platform);
    setShareError(null);

    try {
      const response = await fetch(`/api/share/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to share on ${platformName}.`);
      }

      setSharedPlatforms((current) => [...new Set([...current, platform])]);
      onPostPublished();
    } catch (error) {
      setShareError(error instanceof Error ? error.message : `Unable to share on ${platformName}.`);
    } finally {
      setSharingPlatform(null);
    }
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-9 w-9 place-items-center rounded-md text-slate-400 transition hover:bg-indigo-50 hover:text-[#4338ca]"
        aria-label="Share post"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute bottom-0 right-10 z-20 w-40 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
          {sharePlatforms.map((platform) => (
            (() => {
              const hasBeenShared = sharedPlatforms.includes(platform.action);
              const isSharing = sharingPlatform === platform.action;

              return (
                <button
                  key={platform.name}
                  type="button"
                  disabled={hasBeenShared || isSharing}
                  onClick={() => void sharePost(platform.action)}
                  title={hasBeenShared ? `Already posted on ${platform.name}` : undefined}
                  className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-70"
                >
                  <Image src={platform.image} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                  <span className="flex-1">{platform.name}</span>
                  {hasBeenShared && <Check className="h-3.5 w-3.5 text-emerald-600" aria-label="Posted" />}
                  {isSharing && <span className="text-[10px] text-slate-500">Posting…</span>}
                </button>
              );
            })()
          ))}
          {shareError && <p className="px-2 pb-1 pt-1 text-xs font-medium text-red-600">{shareError}</p>}
        </div>
      )}

    </div>
  );
}
