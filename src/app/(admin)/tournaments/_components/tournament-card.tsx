"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { TeamCrest } from "@/components/ui/avatar";
import { cn, formatDateRange } from "@/lib/utils";
import type { Tournament, TournamentStatus } from "@/types";

/** The edge bar carries status at a glance, before the badge is read. */
const ACCENT: Record<TournamentStatus, string> = {
  ONGOING: "bg-pitch",
  UPCOMING: "bg-sky",
  COMPLETED: "bg-faint",
};

function seasonLine(tournament: Tournament): string | null {
  const parts = [
    tournament.seriesName,
    tournament.seasonName ??
      (tournament.seasonNumber ? `Season ${tournament.seasonNumber}` : undefined),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : null;
}

function CardStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="px-5 py-3">
      <p className="display text-2xl leading-none text-text tabular">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const season = seasonLine(tournament);

  return (
    <Link
      href={`/tournaments/${tournament._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface",
        "transition-colors hover:border-line-strong hover:bg-surface-2"
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", ACCENT[tournament.status])}
        aria-hidden
      />

      <div className="flex items-start gap-3.5 px-5 py-4 pl-6">
        <TeamCrest
          name={tournament.shortName || tournament.name}
          src={tournament.logo}
          size="lg"
          className="rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <h3 className="display truncate text-lg leading-tight text-text">
            {tournament.name}
          </h3>
          {season && (
            <p className="mt-0.5 truncate text-sm text-muted">{season}</p>
          )}
          <div className="mt-2">
            <StatusBadge status={tournament.status} />
          </div>
        </div>
      </div>

      <dl className="mt-auto flex flex-col gap-1.5 border-t border-line px-5 py-3 pl-6 text-sm">
        <div className="flex items-center gap-2 text-muted">
          <CalendarDays className="size-4 shrink-0 text-faint" aria-hidden />
          <dt className="sr-only">Dates</dt>
          <dd className="truncate tabular">
            {formatDateRange(tournament.startDate, tournament.endDate)}
          </dd>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <MapPin className="size-4 shrink-0 text-faint" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd className="truncate">{tournament.location || "Venue to be confirmed"}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 divide-x divide-line border-t border-line pl-1">
        <CardStat label="Teams" value={tournament.teamCount ?? 0} />
        <CardStat label="Players" value={tournament.playerCount ?? 0} />
      </div>
    </Link>
  );
}
