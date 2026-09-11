"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-line",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative shrink-0 px-3.5 py-2.5 text-sm font-medium transition-colors",
              active ? "text-amber" : "text-muted hover:text-text"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-faint tabular">{tab.count}</span>
            )}
            {active && (
              <span
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
