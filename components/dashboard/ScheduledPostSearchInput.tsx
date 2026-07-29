"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Live search for Scheduled Posts — types straight into the URL's `q` param
 * (debounced) instead of requiring Enter/a form submit. The page itself
 * stays a server component reading searchParams, so this just drives a
 * client-side (no full reload) navigation to it as the user types.
 */
export default function ScheduledPostSearchInput({
  initialValue,
  status,
  platform,
}: {
  initialValue: string;
  status: string;
  platform: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The server can hand back a new committed value (e.g. "Clear filters" was
  // clicked elsewhere on the page) — stay in sync with it.
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const trimmed = value.trim();

    if (trimmed === initialValue.trim()) return;

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      if (trimmed) params.set("q", trimmed);
      if (status !== "all") params.set("status", status);
      if (platform !== "all") params.set("platform", platform);

      const query = params.toString();
      router.replace(query ? `/dashboard/scheduled-posts?${query}` : "/dashboard/scheduled-posts", { scroll: false });
    }, 300);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, status, platform]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          // Nothing to submit anymore — Enter would otherwise do nothing
          // useful, so just let it get out of the way.
          if (event.key === "Enter") event.preventDefault();
        }}
        placeholder="Search scheduled content..."
        aria-label="Search scheduled content"
        className="h-9 w-full rounded-control border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
      />
    </div>
  );
}
