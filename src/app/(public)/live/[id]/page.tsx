"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { LotCard, type LotFlash } from "@/components/live/lot-card";
import { TeamStrip } from "@/components/live/team-strip";
import { BidHistory } from "@/components/auction/auction-player-card";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAuctionSocket, type AuctionMessage } from "@/hooks/use-auction-socket";
import { auctionsApi } from "@/lib/api/auctions";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export default function LiveBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [flash, setFlash] = useState<LotFlash | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEvent = useCallback((message: AuctionMessage) => {
    if (message.event === "PLAYER_SOLD") {
      const team = message.data.team as { name?: string } | undefined;
      setFlash({ kind: "SOLD", team: team?.name, price: message.data.soldPrice as number });
    } else if (message.event === "PLAYER_UNSOLD") {
      setFlash({ kind: "UNSOLD" });
    } else {
      return;
    }
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }, []);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  const { status: socketStatus } = useAuctionSocket(id, { notify: false, onEvent });

  const state = useQuery({
    queryKey: queryKeys.auctionState(id),
    queryFn: () => auctionsApi.state(id),
    refetchInterval: socketStatus === "open" ? false : 5000,
  });

  if (state.isLoading) return <LoadingState label="Joining the auction" />;
  if (state.isError || !state.data) {
    return (
      <ErrorState
        title="Couldn't load this auction"
        message={state.error ? (state.error as Error).message : "Not found"}
        onRetry={() => state.refetch()}
      />
    );
  }

  const { auction, currentPlayer, nextBid, teams, bidHistory } = state.data;
  const leadingTeam = teams.find((team) => team.isHighestBidder) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            socketStatus === "open" ? "text-muted" : "text-amber"
          )}
        >
          <Radio className="size-3.5" aria-hidden />
          {socketStatus === "open" ? "Live" : "Reconnecting"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <LotCard
          auction={auction}
          currentPlayer={currentPlayer}
          nextBid={nextBid}
          leadingTeam={leadingTeam}
          flash={flash}
        />
        <Panel className="flex flex-col">
          <PanelHeader title="Bids" description="Latest first" />
          <BidHistory bids={bidHistory} limit={10} />
        </Panel>
      </div>

      <TeamStrip teams={teams} maxSquadSize={auction.maxSquadSize} />
    </div>
  );
}
