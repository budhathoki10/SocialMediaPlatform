import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

/**
 * One shared empty state for every dashboard list panel — Upcoming Posts,
 * Connected Accounts, Recent News, Activity Feed, and (later phases)
 * Scheduled Posts / News Feed / Instagram inbox all had their own
 * independently-built version of "title + subtext" with no shared shape.
 * Pass `className` to control height (e.g. "min-h-36") per panel.
 */
export default function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`grid place-items-center px-5 text-center ${className}`}>
      <div>
        {Icon && (
          <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-control bg-slate-100 text-slate-400">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">{description}</p>
        {action}
      </div>
    </div>
  );
}
