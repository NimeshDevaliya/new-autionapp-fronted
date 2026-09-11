"use client";

import { useQuery } from "@tanstack/react-query";
import { Swords } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { matchesApi } from "@/lib/api/matches";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";
import type { Match } from "@/types";

export function MatchesTab({ tournamentId }: { tournamentId: string }) {
  const params = { tournament: tournamentId, limit: 100 };

  const matches = useQuery({
    queryKey: queryKeys.matchList(params),
    queryFn: () => matchesApi.list(params),
  });

  const columns: Column<Match>[] = [
    {
      key: "teams",
      header: "Match",
      render: (match) => (
        <div className="flex items-center gap-2.5">
          <TeamCrest
            name={match.teamA?.name ?? "?"}
            src={match.teamA?.logo}
            color={match.teamA?.color}
            size="sm"
          />
          <span className="font-medium text-text">
            {match.teamA?.shortName || match.teamA?.name || "TBC"}
          </span>
          <span className="text-xs text-faint">v</span>
          <TeamCrest
            name={match.teamB?.name ?? "?"}
            src={match.teamB?.logo}
            color={match.teamB?.color}
            size="sm"
          />
          <span className="font-medium text-text">
            {match.teamB?.shortName || match.teamB?.name || "TBC"}
          </span>
        </div>
      ),
    },
    {
      key: "number",
      header: "No.",
      numeric: true,
      render: (match) => (match.matchNumber ? match.matchNumber : "—"),
    },
    {
      key: "date",
      header: "Date",
      render: (match) => (
        <span className="tabular text-muted">{formatDate(match.matchDate)}</span>
      ),
    },
    {
      key: "venue",
      header: "Venue",
      render: (match) => (
        <span className="text-muted">{match.venue || "To be confirmed"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (match) => <StatusBadge status={match.status} />,
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
  ];

  if (matches.isError) {
    return (
      <Panel>
        <ErrorState
          message={matches.error.message}
          onRetry={() => matches.refetch()}
        />
      </Panel>
    );
  }

  return (
    <Panel>
      {matches.isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          rows={matches.data?.items ?? []}
          keyOf={(match) => match._id}
          emptyState={
            <EmptyState
              icon={Swords}
              title="No matches scheduled"
              message="Matches added to this tournament will show up here."
            />
          }
        />
      )}
    </Panel>
  );
}
