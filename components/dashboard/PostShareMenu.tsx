"use client";

import { Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const sharePlatforms = [
  { name: "LinkedIn", image: "/landing/linkedin.png", action: "linkedin" },
  { name: "Instagram", image: "/landing/instagram.png", action: "instagram" },
  { name: "Facebook", image: "/landing/facebook.png", action: "facebook" },
] as const;

type PostShareMenuProps = {
  postId: string;
};

export default function PostShareMenu({ postId }: PostShareMenuProps) {
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

  async function handleLinkedIn() {
  
      const confirmed = window.confirm("Are you sure you want to share this post on LinkedIn?");
  
  if (!confirmed) {
    return; // stop if user cancels
  }
  
    const response = await fetch("/api/share/linkedin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const data = await response.json();
    setIsOpen(false);

  }

  function handleInstagram() {
    alert("clicked instagram");
    setIsOpen(false);
  }

  function handleFacebook() {
    alert("clicked facebook");
    setIsOpen(false);
  }

  const platformHandlers = {
    linkedin: handleLinkedIn,
    instagram: handleInstagram,
    facebook: handleFacebook,
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="grid h-9 w-9 place-items-center rounded-md text-slate-400 transition hover:bg-indigo-50 hover:text-[#4338ca]"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute bottom-0 right-10 z-20 w-40 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
          {sharePlatforms.map((platform) => (
            <button
              key={platform.name}
              type="button"
              onClick={() => void platformHandlers[platform.action]()}
              className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Image src={platform.image} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
              <span>{platform.name}</span>
            </button>
          ))}
        </div>
      )}

   
    </div>
  );
}
