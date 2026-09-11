"use client";

import { useQuery } from "@tanstack/react-query";
import { ListOrdered } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import type { PointsTableRow } from "@/types";

export function PointsTableTab({ tournamentId }: { tournamentId: string }) {
  const pointsTable = useQuery({
    queryKey: queryKeys.pointsTable(tournamentId),
    queryFn: () => tournamentsApi.pointsTable(tournamentId),
  });

  const columns: Column<PointsTableRow>[] = [
    {
      key: "position",
      header: "#",
      className: "w-12",
      render: (_row, index) => (
        <span className="tabular text-faint">{index + 1}</span>
      ),
    },
    {
      key: "team",
      header: "Team",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <TeamCrest
            name={row.team.name}
            src={row.team.logo}
            color={row.team.color}
            size="sm"
          />
          <span className="font-medium text-text">{row.team.name}</span>
        </div>
      ),
    },
    { key: "matches", header: "Matches", numeric: true, render: (row) => row.matches },
    { key: "wins", header: "Won", numeric: true, render: (row) => row.wins },
    { key: "losses", header: "Lost", numeric: true, render: (row) => row.losses },
    {
      key: "points",
      header: "Points",
      numeric: true,
      render: (row) => (
        <span className="display text-base text-amber">{row.points}</span>
      ),
    },
    { key: "runs", header: "Runs", numeric: true, render: (row) => row.runs },
    { key: "wickets", header: "Wickets", numeric: true, render: (row) => row.wickets },
  ];

  if (pointsTable.isError) {
    return (
      <Panel>
        <ErrorState
          message={pointsTable.error.message}
          onRetry={() => pointsTable.refetch()}
        />
      </Panel>
    );
  }

  return (
    <Panel>
      {pointsTable.isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          rows={pointsTable.data ?? []}
          keyOf={(row) => row.team._id}
          emptyState={
            <EmptyState
              icon={ListOrdered}
              title="No standings yet"
              message="The points table fills in as match results are recorded."
            />
          }
        />
      )}
    </Panel>
  );
}
