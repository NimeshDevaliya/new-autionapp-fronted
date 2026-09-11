import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Auction amounts are held in lakhs, matching how the league quotes prices.
 * 100 lakh rolls over to a crore.
 */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value >= 100) {
    const crore = value / 100;
    return `${Number.isInteger(crore) ? crore : crore.toFixed(2)} Cr`;
  }
  return `${Number.isInteger(value) ? value : value.toFixed(2)} L`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  if (!start && !end) return "Dates to be confirmed";
  if (start && !end) return `From ${formatDate(start)}`;
  if (!start && end) return `Until ${formatDate(end)}`;
  return `${formatDate(start)} to ${formatDate(end)}`;
}

export function initials(name: string | null | undefined, max = 2): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const ROLE_LABELS: Record<string, string> = {
  BATTER: "Batter",
  BOWLER: "Bowler",
  ALL_ROUNDER: "All-rounder",
  WICKET_KEEPER: "Wicket-keeper",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  return ROLE_LABELS[role] ?? role;
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
