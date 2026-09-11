import { cn } from "@/lib/utils";

type Tone = "neutral" | "amber" | "pitch" | "ball" | "sky";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-3 text-muted border-line-strong",
  amber: "bg-amber/12 text-amber border-amber/35",
  pitch: "bg-pitch/12 text-pitch border-pitch/35",
  ball: "bg-ball/12 text-ball border-ball/35",
  sky: "bg-sky/12 text-sky border-sky/35",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  ONGOING: "pitch",
  LIVE: "pitch",
  UPCOMING: "sky",
  DRAFT: "neutral",
  SCHEDULED: "sky",
  COMPLETED: "neutral",
  PAUSED: "amber",
  ACTIVE: "pitch",
  INACTIVE: "neutral",
  SOLD: "pitch",
  UNSOLD: "ball",
  PENDING: "neutral",
  IN_AUCTION: "amber",
  ABANDONED: "ball",
  SUPER_ADMIN: "amber",
  AUCTION_ADMIN: "sky",
};

const STATUS_LABELS: Record<string, string> = {
  ALL_ROUNDER: "All-rounder",
  WICKET_KEEPER: "Wicket-keeper",
  IN_AUCTION: "Under the hammer",
  SUPER_ADMIN: "Super admin",
  AUCTION_ADMIN: "Auction admin",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const label =
    STATUS_LABELS[status] ??
    status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");

  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} className={className}>
      {(status === "LIVE" || status === "ONGOING") && (
        <span className="size-1.5 rounded-full bg-current animate-live" aria-hidden />
      )}
      {label}
    </Badge>
  );
}
