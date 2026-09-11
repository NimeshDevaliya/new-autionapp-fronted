import { cn } from "@/lib/utils";

/**
 * Surfaces are separated by borders and surface steps rather than shadows —
 * shadows read as mud on a dark ground.
 */
export function Panel({
  children,
  className,
  as: Component = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Component
      className={cn(
        "rounded-xl border border-line bg-surface overflow-hidden",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4",
        className
      )}
    >
      <div>
        <h2 className="display text-lg text-text">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "amber" | "pitch" | "ball";
  className?: string;
}) {
  const valueTone = {
    default: "text-text",
    amber: "text-amber",
    pitch: "text-pitch",
    ball: "text-ball",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface px-4 py-3.5",
        className
      )}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("display mt-1 text-3xl leading-none tabular", valueTone)}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}
