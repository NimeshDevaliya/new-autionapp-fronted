import { cn, initials } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

/** Falls back to initials — most players have no photo on file. */
export function PlayerAvatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-line-strong bg-surface-2 font-semibold text-muted",
        SIZES[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}

/** Team mark: uses the team's own colour as identity, not decoration. */
export function TeamCrest({
  name,
  src,
  color,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  color?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      style={!src ? { backgroundColor: color ?? "#24314c" } : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md",
        "font-semibold text-white",
        SIZES[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
