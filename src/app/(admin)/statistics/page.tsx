"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChartBar, Trophy, UserSquare2 } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Select } from "@/components/ui/field";
import { Panel, PanelHeader, StatCard } from "@/components/ui/panel";
import { PlayerAvatar, TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { statisticsApi } from "@/lib/api/statistics";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { cn, roleLabel } from "@/lib/utils";
import type {
  LeaderboardEntry,
  PointsTableRow,
  TournamentStatistics,
} from "@/types";

const LEADERBOARD_LIMIT = 10;

/** Counts read better grouped; never invent a value that isn't there. */
function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-IN");
}

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
    queryKey: queryKeys.leaderboards({ limit: LEADERBOARD_LIMIT }),
    queryFn: () => statisticsApi.leaderboards({ limit: LEADERBOARD_LIMIT }),
    enabled: !scoped,
  });

  const source = scoped ? stats : leaderboards;
  const topRunScorers: LeaderboardEntry[] = scoped
    ? stats.data?.topRunScorers ?? []
    : leaderboards.data?.topRunScorers ?? [];
  const topWicketTakers: LeaderboardEntry[] = scoped
    ? stats.data?.topWicketTakers ?? []
    : leaderboards.data?.topWicketTakers ?? [];
  // Totals only exist on the tournament endpoint — no faking them league-wide.
  const totals: TournamentStatistics["totals"] | null = scoped
    ? stats.data?.totals ?? null
    : null;
  const highestScores = scoped ? stats.data?.highestScores ?? [] : [];

  return (
    <>
      <PageHeader
        title="Statistics"
        description="Leaderboards and standings across the league, or inside one tournament."
      />

      <Panel className="mb-5 p-4">
        <div className="max-w-sm">
          <Select
            label="Tournament"
            value={tournamentId}
            onChange={(event) => setTournamentId(event.target.value)}
            hint={
              scoped
                ? "Totals, standings and highest scores are scoped to this tournament."
                : "Across every tournament, only leaderboards are available."
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
        <ErrorState
          message={(source.error as Error).message}
          onRetry={() => source.refetch()}
        />
      ) : (
        <>
          {totals && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Matches" value={formatCount(totals.matches)} />
              <StatCard label="Teams" value={formatCount(totals.teams)} />
              <StatCard label="Players" value={formatCount(totals.players)} />
              <StatCard label="Runs" value={formatCount(totals.runs)} />
              <StatCard label="Wickets" value={formatCount(totals.wickets)} />
            </div>
          )}

          {topRunScorers.length === 0 && topWicketTakers.length === 0 ? (
            <div className={cn(totals && "mt-6")}>
              <Panel>
                <EmptyState
                  icon={ChartBar}
                  title="No match data yet"
                  message={
                    scoped
                      ? "Leaderboards fill in once matches in this tournament have scorecards."
                      : "Leaderboards fill in once matches have been scored."
                  }
                />
              </Panel>
            </div>
          ) : (
            <div className={cn("grid gap-5 xl:grid-cols-2", totals && "mt-6")}>
              <Panel>
                <PanelHeader
                  title="Top run scorers"
                  description={
                    scoped ? "In this tournament" : "Across every tournament"
                  }
                />
                <LeaderboardTable
                  entries={topRunScorers}
                  metricHeader="Runs"
                  metricOf={(entry) => formatCount(entry.runs)}
                  supportHeader="Inns"
                  supportOf={(entry) => formatCount(entry.innings)}
                  emptyMessage="No batting scorecards recorded yet."
                />
              </Panel>

              <Panel>
                <PanelHeader
                  title="Top wicket takers"
                  description={
                    scoped ? "In this tournament" : "Across every tournament"
                  }
                />
                <LeaderboardTable
                  entries={topWicketTakers}
                  metricHeader="Wickets"
                  metricOf={(entry) => formatCount(entry.wickets)}
                  supportHeader="Inns"
                  supportOf={(entry) => formatCount(entry.innings)}
                  emptyMessage="No bowling figures recorded yet."
                />
              </Panel>
            </div>
          )}

          {scoped && (
            <>
              <Panel className="mt-5">
                <PanelHeader
                  title="Highest individual scores"
                  description="Best single innings in this tournament."
                />
                <DataTable
                  columns={HIGHEST_SCORE_COLUMNS}
                  rows={highestScores}
                  keyOf={(row) => row._id}
                  emptyState={
                    <EmptyState
                      icon={UserSquare2}
                      title="No innings recorded"
                      message="Individual scores appear once matches have scorecards."
                      className="py-10"
                    />
                  }
                />
              </Panel>

              <Panel className="mt-5">
                <PanelHeader
                  title="Points table"
                  description="Standings for this tournament."
                />
                {pointsTable.isLoading ? (
                  <LoadingState label="Loading points table" className="py-10" />
                ) : pointsTable.isError ? (
                  <ErrorState
                    message={(pointsTable.error as Error).message}
                    onRetry={() => pointsTable.refetch()}
                    className="py-10"
                  />
                ) : (
                  <DataTable
                    columns={POINTS_TABLE_COLUMNS}
                    rows={pointsTable.data ?? []}
                    keyOf={(row) => row.team._id}
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
            </>
          )}
        </>
      )}
    </>
  );
}

/**
 * Ranked leaderboard. Kept local rather than using DataTable so two of these
 * sit side by side at 1280px without forcing a horizontal scroll.
 */
function LeaderboardTable({
  entries,
  metricHeader,
  metricOf,
  supportHeader,
  supportOf,
  emptyMessage,
}: {
  entries: LeaderboardEntry[];
  metricHeader: string;
  metricOf: (entry: LeaderboardEntry) => string;
  supportHeader: string;
  supportOf: (entry: LeaderboardEntry) => string;
  emptyMessage: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={UserSquare2}
        title="Nothing to rank"
        message={emptyMessage}
        className="py-10"
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[340px] border-collapse text-sm">
        <thead>
          <tr className="bg-surface-2">
            <th
              scope="col"
              className="w-12 border-b border-line-strong px-4 py-3 text-right font-semibold text-muted"
            >
              #
            </th>
            <th
              scope="col"
              className="border-b border-line-strong px-4 py-3 text-left font-semibold text-muted"
            >
              Player
            </th>
            <th
              scope="col"
              className="border-b border-line-strong px-4 py-3 text-right font-semibold text-muted"
            >
              {supportHeader}
            </th>
            <th
              scope="col"
              className="border-b border-line-strong px-4 py-3 text-right font-semibold text-muted"
            >
              {metricHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const name = entry.player?.fullName ?? "Unknown player";
            return (
              <tr
                key={entry._id}
                className={cn(
                  "border-b border-line last:border-0",
                  index % 2 === 1 && "bg-surface/40"
                )}
              >
                <td className="px-4 py-3 text-right text-faint tabular">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/players/${entry._id}`}
                    className="flex min-w-0 items-center gap-3 transition-colors hover:text-amber"
                  >
                    <PlayerAvatar
                      name={name}
                      src={entry.player?.profileImage}
                      size="sm"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-text">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {roleLabel(entry.player?.role)}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-muted tabular">
                  {supportOf(entry)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-text tabular">
                  {metricOf(entry)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type HighestScore = TournamentStatistics["highestScores"][number];

const HIGHEST_SCORE_COLUMNS: Column<HighestScore>[] = [
  {
    key: "player",
    header: "Player",
    render: (row) => {
      const name = row.player?.fullName ?? "Unknown player";
      return (
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar name={name} src={row.player?.profileImage} size="sm" />
          <span className="truncate font-medium text-text">{name}</span>
        </div>
      );
    },
  },
  {
    key: "team",
    header: "Team",
    render: (row) =>
      row.team ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamCrest name={row.team.name} src={row.team.logo} size="sm" />
          <span className="truncate text-text">{row.team.name}</span>
        </div>
      ) : (
        <span className="text-faint">—</span>
      ),
  },
  {
    key: "runs",
    header: "Runs",
    numeric: true,
    render: (row) => (
      <span className="font-semibold text-text">{formatCount(row.runs)}</span>
    ),
  },
  {
    key: "balls",
    header: "Balls",
    numeric: true,
    render: (row) => (
      <span className="text-muted">{formatCount(row.balls)}</span>
    ),
  },
];

const POINTS_TABLE_COLUMNS: Column<PointsTableRow>[] = [
  {
    key: "position",
    header: "#",
    numeric: true,
    className: "w-12",
    render: (_row, index) => <span className="text-faint">{index + 1}</span>,
  },
  {
    key: "team",
    header: "Team",
    render: (row) => (
      <div className="flex min-w-0 items-center gap-3">
        <TeamCrest
          name={row.team.name}
          src={row.team.logo}
          color={row.team.color}
          size="sm"
        />
        <span className="min-w-0">
          <span className="block truncate font-medium text-text">
            {row.team.name}
          </span>
          {row.team.shortName && (
            <span className="block truncate text-xs text-muted">
              {row.team.shortName}
            </span>
          )}
        </span>
      </div>
    ),
  },
  {
    key: "matches",
    header: "Matches",
    numeric: true,
    render: (row) => formatCount(row.matches),
  },
  {
    key: "wins",
    header: "Wins",
    numeric: true,
    render: (row) => (
      <span className="text-pitch">{formatCount(row.wins)}</span>
    ),
  },
  {
    key: "losses",
    header: "Losses",
    numeric: true,
    render: (row) => <span className="text-muted">{formatCount(row.losses)}</span>,
  },
  {
    key: "points",
    header: "Points",
    numeric: true,
    render: (row) => (
      <span className="font-semibold text-text">{formatCount(row.points)}</span>
    ),
  },
];
