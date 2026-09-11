"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  CirclePause,
  CirclePlay,
  ListOrdered,
  Radio,
  SkipForward,
  Square,
} from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { BidPanel } from "@/components/auction/bid-panel";
import { TeamPurseCard } from "@/components/auction/team-purse-card";
import {
  AuctionPlayerCard,
  BidHistory,
} from "@/components/auction/auction-player-card";
import { PlayerAvatar } from "@/components/ui/avatar";
import { auctionsApi } from "@/lib/api/auctions";
import { queryKeys } from "@/lib/query-keys";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { useAuctionSocket } from "@/hooks/use-auction-socket";
import { cn, formatMoney, roleLabel } from "@/lib/utils";

export default function AuctionConsolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [queueOpen, setQueueOpen] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const { status: socketStatus } = useAuctionSocket(id);

  const state = useQuery({
    queryKey: queryKeys.auctionState(id),
    queryFn: () => auctionsApi.state(id),
    refetchInterval: socketStatus === "open" ? false : 5000,
  });

  const queue = useQuery({
    queryKey: queryKeys.auctionPlayers(id, { status: "PENDING" }),
    queryFn: () => auctionsApi.players(id, { status: "PENDING" }),
    enabled: queueOpen,
  });

  const invalidate = [queryKeys.auctionState(id), queryKeys.auction(id)];

  const start = useToastMutation({
    mutationFn: () => auctionsApi.start(id),
    successMessage: "Auction started",
    invalidate,
  });
  const pause = useToastMutation({
    mutationFn: () => auctionsApi.pause(id),
    successMessage: "Auction paused",
    invalidate,
  });
  const resume = useToastMutation({
    mutationFn: () => auctionsApi.resume(id),
    successMessage: "Auction resumed",
    invalidate,
  });
  const complete = useToastMutation({
    mutationFn: () => auctionsApi.complete(id),
    successMessage: "Auction completed",
    invalidate,
    onSuccess: () => setConfirmComplete(false),
  });
  const bid = useToastMutation({
    mutationFn: (teamId: string) => auctionsApi.placeBid(id, { teamId }),
    successMessage: "Bid placed",
    invalidate,
  });
  const sell = useToastMutation({
    mutationFn: () => auctionsApi.sell(id),
    successMessage: (data) => `Sold for ${formatMoney(data.soldPrice)}`,
    invalidate: [...invalidate, queryKeys.teams, queryKeys.dashboard],
  });
  const unsold = useToastMutation({
    mutationFn: () => auctionsApi.markUnsold(id),
    successMessage: "Marked unsold",
    invalidate,
  });
  const nextPlayer = useToastMutation({
    mutationFn: () => auctionsApi.nextPlayer(id),
    successMessage: "Next player is up",
    invalidate,
  });
  const pickPlayer = useToastMutation({
    mutationFn: (auctionPlayerId: string) =>
      auctionsApi.setCurrentPlayer(id, auctionPlayerId),
    successMessage: "Player is under the hammer",
    invalidate,
    onSuccess: () => {
      setQueueOpen(false);
      queryClient.invalidateQueries({ queryKey: ["auction", id, "players"] });
    },
  });

  if (state.isLoading) return <LoadingState label="Loading the auction" />;
  if (state.isError) {
    return (
      <ErrorState
        title="Couldn't load the auction"
        message={(state.error as Error).message}
        onRetry={() => state.refetch()}
      />
    );
  }

  const { auction, currentPlayer, nextBid, teams, bidHistory } = state.data!;
  const isLive = auction.status === "LIVE";
  const leadingTeam =
    teams.find((team) => team.isHighestBidder) ?? null;

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
              {auction.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={auction.status} />
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs",
                  socketStatus === "open" ? "text-muted" : "text-amber"
                )}
                title={
                  socketStatus === "open"
                    ? "Receiving live updates from the server"
                    : "Connection lost — retrying, and polling in the meantime"
                }
              >
                <Radio className="size-3.5" aria-hidden />
                {socketStatus === "open" ? "Updates connected" : "Reconnecting"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setQueueOpen(true)}>
            <ListOrdered className="size-4" aria-hidden />
            Queue
          </Button>

          {auction.status === "DRAFT" && (
            <Button variant="primary" onClick={() => start.mutate()} loading={start.isPending}>
              <CirclePlay className="size-4" aria-hidden />
              Start auction
            </Button>
          )}
          {auction.status === "LIVE" && (
            <Button variant="secondary" onClick={() => pause.mutate()} loading={pause.isPending}>
              <CirclePause className="size-4" aria-hidden />
              Pause
            </Button>
          )}
          {auction.status === "PAUSED" && (
            <Button variant="primary" onClick={() => resume.mutate()} loading={resume.isPending}>
              <CirclePlay className="size-4" aria-hidden />
              Resume
            </Button>
          )}
          {auction.status !== "COMPLETED" && (
            <Button variant="ghost" onClick={() => setConfirmComplete(true)}>
              <Square className="size-4" aria-hidden />
              End
            </Button>
          )}
          <LinkButton href={`/results?auction=${id}`} variant="ghost">
            Results
          </LinkButton>
        </div>
      </div>

      {auction.status === "PAUSED" && (
        <p className="mb-4 rounded-lg border border-amber/35 bg-amber/10 px-4 py-2.5 text-sm text-amber">
          The auction is paused. Bids are blocked until you resume.
        </p>
      )}

      {/* 3 columns on desktop, 2 on tablet, stacked on phones */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="flex flex-col gap-4">
          {currentPlayer ? (
            <AuctionPlayerCard auctionPlayer={currentPlayer} />
          ) : (
            <Panel className="px-5 py-10 text-center text-muted">
              Nobody is up for bidding yet.
            </Panel>
          )}

          <Panel className="hidden xl:block">
            <PanelHeader title="Bid history" />
            <BidHistory bids={bidHistory} />
          </Panel>
        </div>

        <div className="md:order-last md:col-span-2 xl:order-none xl:col-span-1">
          <BidPanel
            currentPlayer={currentPlayer}
            nextBid={nextBid}
            leadingTeam={leadingTeam}
            canAct={isLive}
            onSell={() => sell.mutate()}
            onUnsold={() => unsold.mutate()}
            onNext={() => nextPlayer.mutate()}
            selling={sell.isPending}
            markingUnsold={unsold.isPending}
            movingNext={nextPlayer.isPending}
          />

          <Button
            variant="secondary"
            fullWidth
            className="mt-3"
            onClick={() => nextPlayer.mutate()}
            loading={nextPlayer.isPending}
            disabled={!isLive}
          >
            <SkipForward className="size-4" aria-hidden />
            {currentPlayer ? "Skip to next player" : "Bring up next player"}
          </Button>
        </div>

        <Panel className="flex flex-col">
          <PanelHeader
            title="Teams"
            description={
              isLive && currentPlayer
                ? `Tap a team to bid ${formatMoney(nextBid ?? 0)}`
                : "Bidding opens when a player is up"
            }
          />
          <div className="flex flex-col gap-2 p-3">
            {teams.map((team) => (
              <TeamPurseCard
                key={team._id}
                team={team}
                nextBid={nextBid}
                maxSquadSize={auction.maxSquadSize}
                onBid={() => bid.mutate(team._id)}
                disabled={!isLive || !currentPlayer}
                pending={bid.isPending}
              />
            ))}
          </div>
        </Panel>

        <Panel className="xl:hidden">
          <PanelHeader title="Bid history" />
          <BidHistory bids={bidHistory} />
        </Panel>
      </div>

      <Modal
        open={queueOpen}
        onClose={() => setQueueOpen(false)}
        title="Player queue"
        description="Choose who goes under the hammer next."
        size="lg"
      >
        {queue.isLoading ? (
          <LoadingState />
        ) : queue.data?.length ? (
          <ul className="flex flex-col gap-1.5">
            {queue.data.map((entry) => (
              <li key={entry._id}>
                <button
                  onClick={() => pickPlayer.mutate(entry._id)}
                  disabled={!isLive || pickPlayer.isPending}
                  className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface-3 disabled:opacity-50"
                >
                  <span className="w-8 shrink-0 text-sm text-faint tabular">
                    #{entry.order}
                  </span>
                  <PlayerAvatar
                    name={entry.player.fullName}
                    src={entry.player.profileImage}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text">
                      {entry.player.fullName}
                    </span>
                    <span className="block text-xs text-muted">
                      {roleLabel(entry.player.role)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-amber tabular">
                    {formatMoney(entry.basePrice)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-muted">
            Every player has been through the auction.
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={() => complete.mutate()}
        title="End this auction?"
        message="No further bids can be placed once the auction is closed. Players still in the queue stay unsold."
        confirmLabel="End auction"
        loading={complete.isPending}
      />
    </>
  );
}
