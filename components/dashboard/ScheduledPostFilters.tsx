"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FilterOption = {
  label: string;
  value: string;
};

type FilterDropdownProps = {
  label: string;
  name: "platform" | "status";
  onChange: (value: string) => void;
  openName: string | null;
  options: FilterOption[];
  setOpenName: (value: string | null) => void;
  value: string;
};

type ScheduledPostFiltersProps = {
  currentPlatform: string;
  currentSearch: string;
  currentStatus: string;
  platformOptions: FilterOption[];
  statusOptions: FilterOption[];
};

function FilterDropdown({ label, name, onChange, openName, options, setOpenName, value }: FilterDropdownProps) {
  const isOpen = openName === name;
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpenName(isOpen ? null : name)}
        className="inline-flex h-9 min-w-40 items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      >
        <span>{selected?.label || label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`absolute left-0 top-11 z-30 w-44 origin-top overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/80 transition-all duration-300 ease-out ${
          isOpen ? "max-h-64 translate-y-0 opacity-100" : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
        }`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpenName(null);
            }}
            className={`flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-semibold transition ${
              value === option.value ? "bg-[#eef2ff] text-[#4338ca]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScheduledPostFilters({
  currentPlatform,
  currentSearch,
  currentStatus,
  platformOptions,
  statusOptions,
}: ScheduledPostFiltersProps) {
  const router = useRouter();
  const [openName, setOpenName] = useState<string | null>(null);
  const [platform, setPlatform] = useState(currentPlatform);
  const [status, setStatus] = useState(currentStatus);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (currentSearch) params.set("q", currentSearch);
    if (status !== "all") params.set("status", status);
    if (platform !== "all") params.set("platform", platform);

    const query = params.toString();
    router.push(query ? `/dashboard/scheduled-posts?${query}` : "/dashboard/scheduled-posts");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <FilterDropdown
        label="Platform"
        name="platform"
        onChange={setPlatform}
        openName={openName}
        options={platformOptions}
        setOpenName={setOpenName}
        value={platform}
      />

      <FilterDropdown
        label="Status"
        name="status"
        onChange={setStatus}
        openName={openName}
        options={statusOptions}
        setOpenName={setOpenName}
        value={status}
      />

      <button className="h-9 rounded-full bg-[#4338ca] px-4 text-xs font-bold text-white transition hover:bg-[#3730a3]">
        Search
      </button>
    </form>
  );
}
