"use client";

import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-amber" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Skeleton rows for tables, so layout doesn't jump when data lands. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-line" aria-hidden>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 rounded bg-surface-2"
              style={{ width: colIndex === 0 ? "30%" : `${100 / (cols + 1)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title = "That didn't load",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
      role="alert"
    >
      <AlertTriangle className="size-7 text-ball" aria-hidden />
      <div>
        <p className="display text-xl text-text">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted">
          {message ?? "Something went wrong while fetching this data."}
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="secondary">
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      <Icon className="size-7 text-faint" aria-hidden />
      <div>
        <p className="display text-xl text-text">{title}</p>
        {message && <p className="mt-1 max-w-md text-sm text-muted">{message}</p>}
      </div>
      {action}
    </div>
  );
}
