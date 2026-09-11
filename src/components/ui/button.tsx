"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-amber text-ink hover:bg-amber/90 border border-amber disabled:bg-amber/40 disabled:border-amber/40",
  secondary:
    "bg-surface-2 text-text border border-line-strong hover:bg-surface-3 hover:border-line-strong",
  ghost: "bg-transparent text-muted border border-transparent hover:bg-surface-2 hover:text-text",
  danger: "bg-ball text-white border border-ball hover:bg-ball/90",
  success: "bg-pitch text-ink border border-pitch hover:bg-pitch/90 font-semibold",
};

const SIZES: Record<Size, string> = {
  // 44px min touch target on md/lg so the auction console works on tablets
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-[15px] gap-2",
  lg: "h-14 px-6 text-lg gap-2.5",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
);

Button.displayName = "Button";

/** Same visual language as Button, for navigation rather than actions. */
export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
} & Omit<React.ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
