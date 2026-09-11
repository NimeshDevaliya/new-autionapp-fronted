"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Swords } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { formatOvers } from "@/components/stats/leaderboard-tables";
import { CricheroesSyncButton } from "@/components/cricheroes/sync-button";
import { matchesApi } from "@/lib/api/matches";
import { queryKeys } from "@/lib/query-keys";
import { cn, formatDate } from "@/lib/utils";
import type { Match, Team } from "@/types";

/** One side of a result: crest, short name and score, the winner in full weight. */
function SideScore({ team, match, won }: { team: Team; match: Match; won: boolean }) {
  const innings = match.innings?.find((i) => i.team === team._id);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <TeamCrest name={team.name} src={team.logo} color={team.color} size="sm" />
      <span className="min-w-0">
        <span className={cn("block truncate", won ? "font-semibold text-text" : "text-muted")}>
          {team.shortName || team.name}
        </span>
        <span className={cn("block text-sm tabular", won ? "text-text" : "text-muted")}>
          {innings ? (
            <>
              {innings.runs}/{innings.wickets}
              <span className="ml-1 text-xs text-faint">({formatOvers(innings.overs)} ov)</span>
            </>
          ) : (
            <span className="text-faint">—</span>
          )}
        </span>
      </span>
    </span>
  );
}

export function MatchesTab({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const params = { tournament: tournamentId, limit: 100 };

  const matches = useQuery({
    queryKey: queryKeys.matchList(params),
    queryFn: () => matchesApi.list(params),
  });

  const columns: Column<Match>[] = [
    {
      key: "number",
      header: "No.",
      className: "w-14",
      render: (match) => (
        <span className="tabular text-faint">{match.matchNumber ?? "—"}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (match) => (
        <span className="tabular text-muted">{formatDate(match.matchDate)}</span>
      ),
    },
    {
      key: "teams",
      header: "Match",
      className: "min-w-[260px]",
      render: (match) => {
        const winnerId = match.winner?._id;
        return (
          <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <SideScore team={match.teamA} match={match} won={winnerId === match.teamA._id} />
            <span className="text-xs text-faint">v</span>
            <SideScore team={match.teamB} match={match} won={winnerId === match.teamB._id} />
          </span>
        );
      },
    },
    {
      key: "result",
      header: "Result",
      render: (match) => (
        <span className="text-muted">
          {match.result || (match.winner ? `${match.winner.name} won` : "—")}
        </span>
      ),
    },
    {
      key: "pom",
      header: "Player of the match",
      render: (match) =>
        match.playerOfTheMatch ? (
          <span className="text-text">{match.playerOfTheMatch.fullName}</span>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
  ];

  return (
    <Panel>
      <PanelHeader
        title="Fixtures and results"
        description="Every match in this tournament. Open one for the full scorecard."
        action={<CricheroesSyncButton tournamentId={tournamentId} />}
      />
      {matches.isError ? (
        <ErrorState message={matches.error.message} onRetry={() => matches.refetch()} />
      ) : matches.isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          rows={matches.data?.items ?? []}
          keyOf={(match) => match._id}
          onRowClick={(match) => router.push(`/matches/${match._id}`)}
          emptyState={
            <EmptyState
              icon={Swords}
              title="No matches yet"
              message="Sync from CricHeroes to pull this tournament's results, or add matches by hand."
            />
          }
        />
      )}
    </Panel>
  );
}
