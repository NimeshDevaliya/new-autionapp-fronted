"use client";

import { useQuery } from "@tanstack/react-query";
import { ListOrdered } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { PointsTable } from "@/components/stats/points-table";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";

export function PointsTableTab({ tournamentId }: { tournamentId: string }) {
  const pointsTable = useQuery({
    queryKey: queryKeys.pointsTable(tournamentId),
    queryFn: () => tournamentsApi.pointsTable(tournamentId),
  });

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
        <TableSkeleton rows={6} cols={8} />
      ) : (
        <PointsTable
          rows={pointsTable.data ?? []}
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
