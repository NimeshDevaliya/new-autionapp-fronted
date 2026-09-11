"use client";

import { useQuery } from "@tanstack/react-query";
import { Bird, TrendingUp } from "lucide-react";
import { Panel, PanelHeader, StatCard } from "@/components/ui/panel";
import { PlayerAvatar } from "@/components/ui/avatar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { roleLabel } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

function LeaderRow({
  entry,
  metric,
  metricLabel,
  detail,
  rank,
}: {
  entry: LeaderboardEntry;
  metric: number;
  metricLabel: string;
  detail: string;
  rank: number;
}) {
  const name = entry.player?.fullName ?? "Unknown player";

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className="w-5 shrink-0 text-sm text-faint tabular">{rank}</span>
      <PlayerAvatar name={name} src={entry.player?.profileImage} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text">{name}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          {entry.player?.role && <span>{roleLabel(entry.player.role)}</span>}
          {detail && <span className="tabular">{detail}</span>}
        </div>
      </div>
      <p className="shrink-0 text-right">
        <span className="display text-xl leading-none text-amber tabular">
          {metric}
        </span>
        <span className="ml-1 text-xs text-muted">{metricLabel}</span>
      </p>
    </li>
  );
}

export function OverviewTab({ tournamentId }: { tournamentId: string }) {
  const stats = useQuery({
    queryKey: queryKeys.tournamentStats(tournamentId),
    queryFn: () => tournamentsApi.statistics(tournamentId),
  });

  if (stats.isLoading) return <LoadingState label="Loading tournament statistics" />;
  if (stats.isError) {
    return (
      <ErrorState message={stats.error.message} onRetry={() => stats.refetch()} />
    );
  }

  const data = stats.data;
  if (!data) return null;

  const runScorers = data.topRunScorers.slice(0, 5);
  const wicketTakers = data.topWicketTakers.slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Matches" value={data.totals.matches} />
        <StatCard label="Teams" value={data.totals.teams} />
        <StatCard label="Players" value={data.totals.players} />
        <StatCard label="Runs" value={data.totals.runs} tone="amber" />
        <StatCard label="Wickets" value={data.totals.wickets} tone="ball" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Top run scorers"
            description="Most runs across the tournament."
          />
          {runScorers.length > 0 ? (
            <ol className="divide-y divide-line">
              {runScorers.map((entry, index) => (
                <LeaderRow
                  key={entry._id}
                  entry={entry}
                  rank={index + 1}
                  metric={entry.runs ?? 0}
                  metricLabel="runs"
                  detail={[
                    entry.innings ? `${entry.innings} inns` : "",
                    entry.strikeRate ? `SR ${entry.strikeRate.toFixed(1)}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
              ))}
            </ol>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No batting data yet"
              message="Run scorers appear once matches have been scored."
            />
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Top wicket takers"
            description="Most wickets across the tournament."
          />
          {wicketTakers.length > 0 ? (
            <ol className="divide-y divide-line">
              {wicketTakers.map((entry, index) => (
                <LeaderRow
                  key={entry._id}
                  entry={entry}
                  rank={index + 1}
                  metric={entry.wickets ?? 0}
                  metricLabel="wkts"
                  detail={[
                    entry.innings ? `${entry.innings} inns` : "",
                    entry.runsConceded !== undefined
                      ? `${entry.runsConceded} conceded`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
              ))}
            </ol>
          ) : (
            <EmptyState
              icon={Bird}
              title="No bowling data yet"
              message="Wicket takers appear once matches have been scored."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
