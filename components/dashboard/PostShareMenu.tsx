"use client";

import { Check, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const sharePlatforms = [
  { name: "LinkedIn", image: "/landing/linkedin.png" },
  { name: "Instagram", image: "/landing/instagram.png" },
  { name: "Facebook", image: "/landing/facebook.png" },
];

type PostShareMenuProps = {
  title?: string | null;
  content: string;
};

export default function PostShareMenu({ title, content }: PostShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function selectPlatform(platform: string) {
    const postText = [title, content].filter(Boolean).join("\n\n");

    try {
      await navigator.clipboard.writeText(postText);
      setSelectedPlatform(platform);
    } catch {
      setSelectedPlatform(null);
    }

    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Share post"
        title="Share post"
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-9 w-9 place-items-center rounded-md text-slate-400 transition hover:bg-indigo-50 hover:text-[#4338ca]"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg" role="menu">
          {sharePlatforms.map((platform) => (
            <button
              key={platform.name}
              type="button"
              role="menuitem"
              onClick={() => void selectPlatform(platform.name)}
              className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Image src={platform.image} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
              <span>{platform.name}</span>
              {selectedPlatform === platform.name && <Check className="ml-auto h-3.5 w-3.5 text-emerald-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}