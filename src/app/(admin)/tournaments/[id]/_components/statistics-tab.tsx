"use client";

import { useQuery } from "@tanstack/react-query";
import { ChartBar } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PlayerAvatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { roleLabel } from "@/lib/utils";
import type { LeaderboardEntry, TournamentStatistics } from "@/types";

type HighestScore = TournamentStatistics["highestScores"][number];

function PlayerCell({
  name,
  image,
  role,
  rank,
}: {
  name: string;
  image?: string;
  role?: string;
  rank: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 shrink-0 text-xs text-faint tabular">{rank}</span>
      <PlayerAvatar name={name} src={image} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-medium text-text">{name}</p>
        <p className="truncate text-xs text-muted">{roleLabel(role)}</p>
      </div>
    </div>
  );
}

export function StatisticsTab({ tournamentId }: { tournamentId: string }) {
  const stats = useQuery({
    queryKey: queryKeys.tournamentStats(tournamentId),
    queryFn: () => tournamentsApi.statistics(tournamentId),
  });

  const runColumns: Column<LeaderboardEntry>[] = [
    {
      key: "player",
      header: "Player",
      render: (entry, index) => (
        <PlayerCell
          name={entry.player?.fullName ?? "Unknown player"}
          image={entry.player?.profileImage}
          role={entry.player?.role}
          rank={index + 1}
        />
      ),
    },
    {
      key: "innings",
      header: "Innings",
      numeric: true,
      render: (entry) => entry.innings ?? 0,
    },
    {
      key: "runs",
      header: "Runs",
      numeric: true,
      render: (entry) => (
        <span className="display text-base text-amber">{entry.runs ?? 0}</span>
      ),
    },
    {
      key: "balls",
      header: "Balls",
      numeric: true,
      render: (entry) => entry.balls ?? 0,
    },
    {
      key: "strikeRate",
      header: "Strike rate",
      numeric: true,
      render: (entry) =>
        entry.strikeRate === undefined ? "—" : entry.strikeRate.toFixed(2),
    },
  ];

  const wicketColumns: Column<LeaderboardEntry>[] = [
    {
      key: "player",
      header: "Player",
      render: (entry, index) => (
        <PlayerCell
          name={entry.player?.fullName ?? "Unknown player"}
          image={entry.player?.profileImage}
          role={entry.player?.role}
          rank={index + 1}
        />
      ),
    },
    {
      key: "innings",
      header: "Innings",
      numeric: true,
      render: (entry) => entry.innings ?? 0,
    },
    {
      key: "wickets",
      header: "Wickets",
      numeric: true,
      render: (entry) => (
        <span className="display text-base text-amber">{entry.wickets ?? 0}</span>
      ),
    },
    {
      key: "runsConceded",
      header: "Runs conceded",
      numeric: true,
      render: (entry) => entry.runsConceded ?? 0,
    },
  ];

  const scoreColumns: Column<HighestScore>[] = [
    {
      key: "player",
      header: "Player",
      render: (score, index) => (
        <PlayerCell
          name={score.player?.fullName ?? "Unknown player"}
          image={score.player?.profileImage}
          role={score.player?.role}
          rank={index + 1}
        />
      ),
    },
    {
      key: "team",
      header: "Team",
      render: (score) => (
        <span className="text-muted">
          {score.team?.name ?? score.team?.shortName ?? "—"}
        </span>
      ),
    },
    {
      key: "runs",
      header: "Runs",
      numeric: true,
      render: (score) => (
        <span className="display text-base text-amber">{score.runs}</span>
      ),
    },
    {
      key: "balls",
      header: "Balls",
      numeric: true,
      render: (score) => score.balls,
    },
    {
      key: "strikeRate",
      header: "Strike rate",
      numeric: true,
      render: (score) =>
        score.balls > 0 ? ((score.runs / score.balls) * 100).toFixed(2) : "—",
    },
  ];

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

  const noData =
    data.topRunScorers.length === 0 &&
    data.topWicketTakers.length === 0 &&
    data.highestScores.length === 0;

  if (noData) {
    return (
      <Panel>
        <EmptyState
          icon={ChartBar}
          title="No statistics yet"
          message="Leaderboards build up as match scorecards are recorded."
        />
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <PanelHeader
          title="Top run scorers"
          description="Ranked by runs scored in this tournament."
        />
        <DataTable
          columns={runColumns}
          rows={data.topRunScorers}
          keyOf={(entry) => entry._id}
          emptyState={
            <EmptyState title="No batting records" message="Nothing scored yet." />
          }
        />
      </Panel>

      <Panel>
        <PanelHeader
          title="Top wicket takers"
          description="Ranked by wickets taken in this tournament."
        />
        <DataTable
          columns={wicketColumns}
          rows={data.topWicketTakers}
          keyOf={(entry) => entry._id}
          emptyState={
            <EmptyState title="No bowling records" message="No wickets recorded yet." />
          }
        />
      </Panel>

      <Panel>
        <PanelHeader
          title="Highest individual scores"
          description="The biggest single-innings knocks."
        />
        <DataTable
          columns={scoreColumns}
          rows={data.highestScores}
          keyOf={(score) => score._id}
          emptyState={
            <EmptyState title="No innings recorded" message="Nothing to show yet." />
          }
        />
      </Panel>
    </div>
  );
}
