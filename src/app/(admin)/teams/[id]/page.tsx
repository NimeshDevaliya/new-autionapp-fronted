"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, StatCard } from "@/components/ui/panel";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PlayerAvatar, TeamCrest } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  TableSkeleton,
} from "@/components/ui/states";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { teamsApi } from "@/lib/api/teams";
import { queryKeys } from "@/lib/query-keys";
import { formatMoney, roleLabel, titleCase } from "@/lib/utils";
import { DEFAULT_TEAM_COLOR, TeamFormModal } from "../team-form-modal";
import type { Player, TeamSquadEntry } from "@/types";

/** `player` comes back populated, but the type allows a bare id. */
function playerOf(entry: TeamSquadEntry): Player | null {
  return typeof entry.player === "string" ? null : entry.player;
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const team = useQuery({
    queryKey: queryKeys.team(id),
    queryFn: () => teamsApi.get(id),
  });

  const squad = useQuery({
    queryKey: queryKeys.teamSquad(id),
    queryFn: () => teamsApi.squad(id),
  });

  const remove = useToastMutation({
    mutationFn: () => teamsApi.remove(id),
    successMessage: "Team deleted",
    invalidate: [queryKeys.teams],
    onSuccess: () => {
      setConfirmDelete(false);
      router.push("/teams");
    },
  });

  const columns: Column<TeamSquadEntry>[] = [
    {
      key: "player",
      header: "Player",
      render: (entry) => {
        const player = playerOf(entry);
        return (
          <div className="flex items-center gap-3">
            <PlayerAvatar
              name={player?.fullName ?? "Unknown"}
              src={player?.profileImage}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {player ? (
                  <Link
                    href={`/players/${player._id}`}
                    className="truncate font-medium text-text hover:text-amber"
                  >
                    {player.fullName}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-muted">
                    Unknown player
                  </span>
                )}
                {entry.isCaptain && <Badge tone="amber">C</Badge>}
                {entry.isViceCaptain && <Badge tone="sky">VC</Badge>}
              </div>
              {player?.category && (
                <p className="mt-0.5 text-xs text-faint">
                  {titleCase(player.category)}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      render: (entry) => (
        <span className="text-muted">{roleLabel(playerOf(entry)?.role)}</span>
      ),
    },
    {
      key: "basePrice",
      header: "Base price",
      numeric: true,
      // retained players never went under the hammer, so they have no base price
      render: (entry) =>
        entry.acquisitionType === "RETAINED" ? (
          <span className="text-faint">—</span>
        ) : (
          formatMoney(entry.basePrice)
        ),
    },
    {
      key: "soldPrice",
      header: "Sold price",
      numeric: true,
      render: (entry) => {
        if (entry.acquisitionType === "RETAINED") {
          return <span className="text-faint">—</span>;
        }
        // an auction player still on the books at 0 went unsold
        if (entry.soldPrice === 0) {
          return <span className="text-ball">Unsold</span>;
        }
        return <span className="text-amber">{formatMoney(entry.soldPrice)}</span>;
      },
    },
    {
      key: "acquisitionType",
      header: "Acquired",
      render: (entry) => {
        if (entry.acquisitionType === "RETAINED") {
          return <Badge tone="sky">Retained</Badge>;
        }
        if (entry.soldPrice === 0) {
          return <Badge tone="ball">Unsold</Badge>;
        }
        return <Badge tone="neutral">Auction</Badge>;
      },
    },
  ];

  if (team.isLoading) return <LoadingState label="Loading the team" />;
  if (team.isError || !team.data) {
    return (
      <ErrorState
        title="Couldn't load this team"
        message={
          team.error ? (team.error as Error).message : "The team wasn't found."
        }
        onRetry={() => team.refetch()}
      />
    );
  }

  const data = team.data;
  const stats = data.stats;
  const spentShare =
    data.budget > 0 ? Math.min(100, (data.spent / data.budget) * 100) : 0;
  const color = data.color || DEFAULT_TEAM_COLOR;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/teams"
            className="mt-3 text-muted transition-colors hover:text-text"
            aria-label="Back to teams"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <TeamCrest
            name={data.name}
            src={data.logo}
            color={data.color}
            size="lg"
          />
          <div className="min-w-0">
            <h1 className="display truncate text-3xl leading-tight text-text">
              {data.name}
            </h1>
            <p className="mt-0.5 truncate text-muted">
              {data.shortName ? `${data.shortName} · ` : ""}
              {data.ownerName || "Owner to be confirmed"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} />
              {typeof data.tournament !== "string" && (
                <Link
                  href={`/tournaments/${data.tournament._id}`}
                  className="text-sm text-sky hover:underline"
                >
                  {data.tournament.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted">Purse remaining</p>
            <p className="display text-4xl leading-none text-amber tabular">
              {formatMoney(data.remainingBudget)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden />
              Edit
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete team"
            >
              <Trash2 className="size-4" aria-hidden />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div
        className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
        role="img"
        aria-label={`${formatMoney(data.spent)} of ${formatMoney(
          data.budget
        )} spent`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${spentShare}%`, backgroundColor: color }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total purse" value={formatMoney(data.budget)} />
        <StatCard
          label="Remaining"
          value={formatMoney(data.remainingBudget)}
          tone="amber"
        />
        <StatCard label="Spent" value={formatMoney(data.spent)} />
        <StatCard
          label="Players bought"
          value={`${data.playersBought ?? 0}/${data.maxPlayers}`}
          hint={`Minimum squad ${data.minPlayers}`}
        />
      </div>

      {stats && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Matches" value={stats.matches} />
          <StatCard label="Wins" value={stats.wins} tone="pitch" />
          <StatCard label="Losses" value={stats.losses} tone="ball" />
          <StatCard label="Runs" value={stats.runs} />
          <StatCard label="Wickets" value={stats.wickets} />
        </div>
      )}

      <Panel className="mt-6">
        <PanelHeader
          title="Squad"
          description={
            squad.data?.length
              ? `${squad.data.length} player${
                  squad.data.length === 1 ? "" : "s"
                } on the books`
              : undefined
          }
        />
        {squad.isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : squad.isError ? (
          <ErrorState
            title="Couldn't load the squad"
            message={(squad.error as Error).message}
            onRetry={() => squad.refetch()}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={squad.data ?? []}
            keyOf={(entry) => entry._id}
            onRowClick={(entry) => {
              const player = playerOf(entry);
              if (player) router.push(`/players/${player._id}`);
            }}
            emptyState={
              <EmptyState
                icon={Users}
                title="No players yet"
                message="Buy players at auction or retain them, and they'll show up here."
              />
            }
          />
        )}
      </Panel>

      <TeamFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        team={data}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        title={`Delete ${data.name}?`}
        message="The team, its purse and its squad record go with it. This can't be undone."
        confirmLabel="Delete team"
        loading={remove.isPending}
      />
    </>
  );
}
