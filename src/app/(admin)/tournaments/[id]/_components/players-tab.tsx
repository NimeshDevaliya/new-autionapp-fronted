"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { playersApi } from "@/lib/api/players";
import { queryKeys } from "@/lib/query-keys";
import { formatMoney, roleLabel } from "@/lib/utils";
import type { Player } from "@/types";

export function PlayersTab({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const params = { tournament: tournamentId, limit: 50 };

  const players = useQuery({
    queryKey: queryKeys.playerList(params),
    queryFn: () => playersApi.list(params),
  });

  const columns: Column<Player>[] = [
    {
      key: "player",
      header: "Player",
      render: (player) => (
        <div className="flex items-center gap-3">
          <PlayerAvatar name={player.fullName} src={player.profileImage} size="sm" />
          <Link
            href={`/players/${player._id}`}
            className="font-medium text-text hover:text-amber hover:underline"
          >
            {player.fullName}
          </Link>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (player) => (
        <span className="text-muted">{roleLabel(player.role)}</span>
      ),
    },
    {
      key: "team",
      header: "Team",
      render: (player) =>
        player.currentTeam ? (
          <span className="text-text">{player.currentTeam.name}</span>
        ) : (
          <Badge tone="neutral">Unsigned</Badge>
        ),
    },
    {
      key: "basePrice",
      header: "Base price",
      numeric: true,
      render: (player) => formatMoney(player.basePrice),
    },
    {
      key: "soldPrice",
      header: "Sold price",
      numeric: true,
      render: (player) => (
        <span className={player.soldPrice ? "text-amber" : "text-faint"}>
          {formatMoney(player.soldPrice)}
        </span>
      ),
    },
  ];

  if (players.isError) {
    return (
      <Panel>
        <ErrorState
          message={players.error.message}
          onRetry={() => players.refetch()}
        />
      </Panel>
    );
  }

  const meta = players.data?.meta;

  return (
    <Panel>
      {players.isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={players.data?.items ?? []}
            keyOf={(player) => player._id}
            onRowClick={(player) => router.push(`/players/${player._id}`)}
            emptyState={
              <EmptyState
                icon={UserRound}
                title="No players yet"
                message="Players registered for this tournament will be listed here."
              />
            }
          />
          {meta && meta.total > meta.limit && (
            <p className="border-t border-line px-4 py-3 text-sm text-muted tabular">
              Showing the first {meta.limit} of {meta.total} players.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
