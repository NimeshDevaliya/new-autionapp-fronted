"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Select } from "@/components/ui/field";
import { Panel, PanelHeader, StatCard } from "@/components/ui/panel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { LeaderboardsPanel } from "@/components/stats/leaderboards-panel";
import { PointsTable } from "@/components/stats/points-table";
import { statisticsApi } from "@/lib/api/statistics";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";

const LIMIT = 10;

export default function StatisticsPage() {
  const [tournamentId, setTournamentId] = useState("");
  const scoped = Boolean(tournamentId);

  const tournaments = useQuery({
    queryKey: queryKeys.tournamentList({ limit: 100 }),
    queryFn: () => tournamentsApi.list({ limit: 100 }),
  });

  const stats = useQuery({
    queryKey: queryKeys.tournamentStats(tournamentId),
    queryFn: () => tournamentsApi.statistics(tournamentId),
    enabled: scoped,
  });

  const pointsTable = useQuery({
    queryKey: queryKeys.pointsTable(tournamentId),
    queryFn: () => tournamentsApi.pointsTable(tournamentId),
    enabled: scoped,
  });

  const leaderboards = useQuery({
    queryKey: queryKeys.leaderboards({ limit: LIMIT }),
    queryFn: () => statisticsApi.leaderboards({ limit: LIMIT }),
    enabled: !scoped,
  });

  const source = scoped ? stats : leaderboards;
  const selected = tournaments.data?.items.find((t) => t._id === tournamentId);

  return (
    <>
      <PageHeader
        title="Statistics"
        description="Top-10 boards and standings — league-wide, or inside one tournament."
      />

      <Panel className="mb-5 p-4">
        <div className="max-w-sm">
          <Select
            label="Tournament"
            value={tournamentId}
            onChange={(event) => setTournamentId(event.target.value)}
            hint={
              scoped
                ? "Totals, standings and best performances are scoped to this tournament."
                : "Across every tournament, only the leaderboards are available."
            }
            disabled={tournaments.isLoading}
          >
            <option value="">All tournaments</option>
            {tournaments.data?.items.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      {source.isLoading ? (
        <LoadingState label="Loading statistics" />
      ) : source.isError ? (
        <ErrorState message={(source.error as Error).message} onRetry={() => source.refetch()} />
      ) : scoped && stats.data ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Matches played" value={stats.data.totals.completedMatches} />
            <StatCard label="Teams" value={stats.data.totals.teams} />
            <StatCard label="Players" value={stats.data.totals.players} />
            <StatCard
              label="Runs"
              value={stats.data.totals.runs.toLocaleString("en-IN")}
              tone="amber"
            />
            <StatCard label="Wickets" value={stats.data.totals.wickets} />
            <StatCard label="Sixes" value={stats.data.totals.sixes} />
          </div>

          <LeaderboardsPanel
            data={stats.data}
            performances={{
              highestScores: stats.data.highestScores,
              bestBowling: stats.data.bestBowling,
            }}
            scopeLabel={selected ? `in ${selected.shortName || selected.name}` : "in this tournament"}
          />

          <Panel>
            <PanelHeader title="Points table" description="Standings for this tournament." />
            {pointsTable.isLoading ? (
              <LoadingState label="Loading points table" className="py-10" />
            ) : pointsTable.isError ? (
              <ErrorState
                message={(pointsTable.error as Error).message}
                onRetry={() => pointsTable.refetch()}
                className="py-10"
              />
            ) : (
              <PointsTable
                rows={pointsTable.data ?? []}
                emptyState={
                  <EmptyState
                    icon={Trophy}
                    title="No standings yet"
                    message="The table fills in once teams are added and matches are played."
                    className="py-10"
                  />
                }
              />
            )}
          </Panel>
        </div>
      ) : leaderboards.data ? (
        <LeaderboardsPanel data={leaderboards.data} scopeLabel="across every tournament" />
      ) : null}
    </>
  );
}
