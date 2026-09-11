"use client";

import { useQuery } from "@tanstack/react-query";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/panel";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { LeaderboardsPanel } from "@/components/stats/leaderboards-panel";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";

export function StatisticsTab({ tournamentId }: { tournamentId: string }) {
  const stats = useQuery({
    queryKey: queryKeys.tournamentStats(tournamentId),
    queryFn: () => tournamentsApi.statistics(tournamentId),
  });

  if (stats.isLoading) return <LoadingState label="Loading statistics" />;
  if (stats.isError) {
    return (
      <Panel>
        <ErrorState message={stats.error.message} onRetry={() => stats.refetch()} />
      </Panel>
    );
  }

  const data = stats.data;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Matches played"
          value={data.totals.completedMatches}
          hint={
            data.totals.matches > data.totals.completedMatches
              ? `${data.totals.matches - data.totals.completedMatches} still to play`
              : undefined
          }
        />
        <StatCard label="Runs" value={data.totals.runs.toLocaleString("en-IN")} tone="amber" />
        <StatCard label="Wickets" value={data.totals.wickets} />
        <StatCard label="Fours" value={data.totals.fours} />
        <StatCard label="Sixes" value={data.totals.sixes} />
        <StatCard label="Players" value={data.totals.players} />
      </div>

      <LeaderboardsPanel
        data={data}
        performances={{ highestScores: data.highestScores, bestBowling: data.bestBowling }}
        scopeLabel="in this tournament"
      />
    </div>
  );
}
