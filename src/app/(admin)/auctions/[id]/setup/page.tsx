"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, UserPlus } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Panel, PanelHeader, StatCard } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { PlayerAvatar } from "@/components/ui/avatar";
import { auctionsApi } from "@/lib/api/auctions";
import { playersApi } from "@/lib/api/players";
import { queryKeys } from "@/lib/query-keys";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { formatMoney, roleLabel } from "@/lib/utils";
import type { AuctionPlayer } from "@/types";

export default function AuctionSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<AuctionPlayer | null>(null);

  const auction = useQuery({
    queryKey: queryKeys.auction(id),
    queryFn: () => auctionsApi.get(id),
  });

  const queued = useQuery({
    queryKey: queryKeys.auctionPlayers(id),
    queryFn: () => auctionsApi.players(id),
  });

  const available = useQuery({
    queryKey: queryKeys.playerList({ search, role: roleFilter, limit: 100 }),
    queryFn: () =>
      playersApi.list({
        search: search || undefined,
        role: roleFilter || undefined,
        limit: 100,
        isActive: "true",
      }),
    enabled: addOpen,
  });

  const queuedPlayerIds = useMemo(
    () => new Set(queued.data?.map((entry) => entry.player._id) ?? []),
    [queued.data]
  );

  const addPlayers = useToastMutation({
    mutationFn: (playerIds: string[]) =>
      auctionsApi.addPlayers(
        id,
        playerIds.map((playerId) => ({ player: playerId }))
      ),
    successMessage: (data) =>
      `${data.added} player${data.added === 1 ? "" : "s"} added to the auction`,
    invalidate: [queryKeys.auction(id), ["auction", id, "players"]],
    onSuccess: () => {
      setSelected(new Set());
      setAddOpen(false);
    },
  });

  const removePlayer = useToastMutation({
    mutationFn: (auctionPlayerId: string) =>
      auctionsApi.removePlayer(id, auctionPlayerId),
    successMessage: "Player removed from the auction",
    invalidate: [queryKeys.auction(id), ["auction", id, "players"]],
    onSuccess: () => setRemoving(null),
  });

  if (auction.isLoading) return <LoadingState label="Loading auction" />;
  if (auction.isError) {
    return (
      <ErrorState
        message={(auction.error as Error).message}
        onRetry={() => auction.refetch()}
      />
    );
  }

  const counts = auction.data?.counts;
  const entries = queued.data ?? [];

  const toggle = (playerId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/auctions"
            className="text-muted transition-colors hover:text-text"
            aria-label="Back to auctions"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="display truncate text-2xl leading-tight">
              {auction.data?.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted">Player pool</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" aria-hidden />
            Add players
          </Button>
          <LinkButton href={`/auctions/${id}`} variant="secondary">
            Open console
          </LinkButton>
        </div>
      </div>

      {counts && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="In the pool" value={counts.total} />
          <StatCard label="Still to come" value={counts.pending} tone="amber" />
          <StatCard label="Sold" value={counts.sold} tone="pitch" />
          <StatCard label="Unsold" value={counts.unsold} tone="ball" />
        </div>
      )}

      <Panel>
        <PanelHeader
          title="Auction order"
          description="Players come up in this order unless you pick someone from the queue."
        />

        {queued.isLoading ? (
          <LoadingState />
        ) : entries.length ? (
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <li
                key={entry._id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-8 shrink-0 text-sm text-faint tabular">
                  #{entry.order}
                </span>
                <PlayerAvatar
                  name={entry.player.fullName}
                  src={entry.player.profileImage}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/players/${entry.player._id}`}
                    className="block truncate font-medium text-text hover:text-amber"
                  >
                    {entry.player.fullName}
                  </Link>
                  <p className="text-xs text-muted">
                    {roleLabel(entry.player.role)}
                  </p>
                </div>

                <span className="hidden shrink-0 text-sm text-muted tabular sm:block">
                  {formatMoney(entry.basePrice)}
                </span>

                <StatusBadge status={entry.status} />

                {entry.status !== "SOLD" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoving(entry)}
                    aria-label={`Remove ${entry.player.fullName} from the auction`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No players in the pool"
            message="Add players before starting the auction."
            action={
              <Button variant="primary" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Add players
              </Button>
            }
          />
        )}
      </Panel>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add players to the auction"
        description="Players already in the pool are hidden."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={selected.size === 0}
              loading={addPlayers.isPending}
              onClick={() => addPlayers.mutate(Array.from(selected))}
            >
              Add {selected.size > 0 ? `${selected.size} ` : ""}
              player{selected.size === 1 ? "" : "s"}
            </Button>
          </>
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="Search"
            placeholder="Player name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="">All roles</option>
            <option value="BATTER">Batter</option>
            <option value="BOWLER">Bowler</option>
            <option value="ALL_ROUNDER">All-rounder</option>
            <option value="WICKET_KEEPER">Wicket-keeper</option>
          </Select>
        </div>

        {available.isLoading ? (
          <LoadingState />
        ) : (
          (() => {
            const selectable =
              available.data?.items.filter(
                (player) => !queuedPlayerIds.has(player._id)
              ) ?? [];

            if (selectable.length === 0) {
              return (
                <p className="py-8 text-center text-muted">
                  No players match this search.
                </p>
              );
            }

            return (
              <ul className="flex flex-col gap-1.5">
                {selectable.map((player) => {
                  const checked = selected.has(player._id);
                  return (
                    <li key={player._id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                          checked
                            ? "border-amber bg-amber/8"
                            : "border-line bg-surface-2 hover:border-line-strong"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(player._id)}
                          className="size-4 accent-amber"
                        />
                        <PlayerAvatar
                          name={player.fullName}
                          src={player.profileImage}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-text">
                            {player.fullName}
                          </span>
                          <span className="block text-xs text-muted">
                            {roleLabel(player.role)}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm text-amber tabular">
                          {formatMoney(player.basePrice)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            );
          })()
        )}
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && removePlayer.mutate(removing._id)}
        title="Remove this player?"
        message={`${removing?.player.fullName ?? "This player"} will be taken out of the auction pool. You can add them back later.`}
        confirmLabel="Remove"
        loading={removePlayer.isPending}
      />
    </>
  );
}
