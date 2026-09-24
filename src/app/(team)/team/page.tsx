"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Radio } from "lucide-react";
import { toast } from "sonner";
import { LotCard } from "@/components/live/lot-card";
import { TeamStrip } from "@/components/live/team-strip";
import { BidButton } from "@/components/team/bid-button";
import { BidHistory } from "@/components/auction/auction-player-card";
import { TeamCrest } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAuctionSocket, type AuctionMessage } from "@/hooks/use-auction-socket";
import { useTeamLogout, useTeamSession } from "@/hooks/use-team-auth";
import { teamAuthApi } from "@/lib/api/team-auth";
import { getTeamToken } from "@/lib/team-auth";
import { queryKeys } from "@/lib/query-keys";
import { cn, formatMoney, roleLabel } from "@/lib/utils";
import type { AuctionState, Player, TeamSquadEntry } from "@/types";

type Feedback =
  | { kind: "placing" }
  | { kind: "accepted"; amount: number }
  | { kind: "rejected"; message: string };

/** Why the Bid button is disabled right now, or null when a tap is allowed. */
function blockedReason(
  state: AuctionState | undefined,
  myTeamId: string,
  socketOpen: boolean,
  authed: boolean
): string | null {
  if (!state) return "Loading…";
  const { auction, currentPlayer, nextBid, teams } = state;
  if (auction.status === "DRAFT") return "The auction hasn't started yet";
  if (auction.status === "COMPLETED") return "The auction is over";
  if (auction.status === "PAUSED") return "Paused — bids are blocked until the operator resumes";
  if (!currentPlayer || nextBid === null) return "Waiting for the next player";
  if (!socketOpen) return "Reconnecting…";
  if (!authed) return "Signing you in…";
  const me = teams.find((t) => t._id === myTeamId);
  if (!me) return "Your team isn't in this auction";
  if (me.status !== "ACTIVE") return "Your team is not active in this auction";
  if (me.isHighestBidder) return "You're leading";
  if ((me.playersBought ?? 0) >= Math.min(me.maxPlayers, auction.maxSquadSize)) {
    return "Squad full";
  }
  if (nextBid > me.remainingBudget) return "Not enough purse left";
  return null;
}

export default function TeamAppPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useTeamLogout();
  const session = useTeamSession();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // guard: no token or rejected session -> sign in
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getTeamToken() || session.isError) router.replace("/team/login");
  }, [session.isError, router]);

  const auctionId = session.data?.auction?._id;
  const teamId = session.data?.team._id ?? "";

  const onEvent = useCallback(
    (message: AuctionMessage) => {
      switch (message.event) {
        case "BID_ACCEPTED":
          setFeedback({ kind: "accepted", amount: message.data.amount as number });
          break;
        case "BID_REJECTED":
          setFeedback({
            kind: "rejected",
            message: String(message.data.message ?? "Bid rejected"),
          });
          if (auctionId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.auctionState(auctionId) });
          }
          break;
        case "AUTH_FAILED":
          toast.error("Your team session has expired. Please sign in again.");
          logout();
          break;
        case "PLAYER_CHANGED":
        case "PLAYER_SOLD":
        case "PLAYER_UNSOLD":
          setFeedback(null);
          break;
        default:
          break;
      }
    },
    [auctionId, queryClient, logout]
  );

  const { status: socketStatus, authed, sendBid } = useAuctionSocket(auctionId, {
    notify: true,
    authToken: getTeamToken(),
    onEvent,
  });

  const state = useQuery({
    queryKey: queryKeys.auctionState(auctionId ?? ""),
    queryFn: () => teamAuthApi.auctionState(auctionId!),
    enabled: !!auctionId,
    refetchInterval: socketStatus === "open" ? false : 5000,
  });

  const squad = useQuery({
    queryKey: queryKeys.teamSquadPublic(teamId),
    queryFn: () => teamAuthApi.squad(teamId),
    enabled: !!teamId,
  });

  if (session.isLoading || (!session.data && !session.isError)) {
    return <LoadingState label="Loading your team" className="min-h-screen" />;
  }
  if (!session.data) return null;

  const { team, auction } = session.data;
  const myState = state.data?.teams.find((t) => t._id === team._id);
  const reason = blockedReason(state.data, team._id, socketStatus === "open", authed);
  const pending = feedback?.kind === "placing";

  const handleBid = () => {
    const current = state.data?.currentPlayer;
    const nextBid = state.data?.nextBid;
    if (!current || nextBid === null || nextBid === undefined) return;
    setFeedback({ kind: "placing" });
    if (!sendBid(current._id, nextBid)) {
      setFeedback({ kind: "rejected", message: "Not connected — trying again" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
        <div className="flex min-w-0 items-center gap-3">
          <TeamCrest name={team.name} src={team.logo} color={team.color} size="lg" />
          <div className="min-w-0">
            <h1 className="display truncate text-2xl leading-tight text-text">{team.name}</h1>
            <p className="text-sm text-muted tabular">
              {myState?.playersBought ?? team.squadCount}/{team.maxPlayers} players
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted">Purse left</p>
          <p className="display text-3xl leading-none text-amber tabular">
            {formatMoney(myState?.remainingBudget ?? team.remainingBudget)}
          </p>
        </div>
      </header>

      {!auction ? (
        <Panel className="px-5 py-10 text-center text-muted">
          No auction has been created for your tournament yet. This page will update on its
          own.
        </Panel>
      ) : state.isLoading ? (
        <LoadingState label="Joining the auction" />
      ) : state.isError || !state.data ? (
        <ErrorState title="Couldn't load the auction" onRetry={() => state.refetch()} />
      ) : (
        <>
          <div className="flex items-center justify-end">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs",
                socketStatus === "open" && authed ? "text-muted" : "text-amber"
              )}
            >
              <Radio className="size-3.5" aria-hidden />
              {socketStatus !== "open" ? "Reconnecting" : authed ? "Connected" : "Signing in"}
            </span>
          </div>

          <LotCard
            auction={state.data.auction}
            currentPlayer={state.data.currentPlayer}
            nextBid={state.data.nextBid}
            leadingTeam={state.data.teams.find((t) => t.isHighestBidder) ?? null}
          />

          <BidButton
            nextBid={state.data.nextBid}
            blockedReason={reason}
            pending={pending}
            onBid={handleBid}
          />

          {feedback && feedback.kind !== "placing" && (
            <p
              role="status"
              className={cn(
                "rounded-lg border px-4 py-2.5 text-center text-sm",
                feedback.kind === "accepted"
                  ? "border-pitch/40 bg-pitch/10 text-pitch"
                  : "border-ball/40 bg-ball/10 text-ball"
              )}
            >
              {feedback.kind === "accepted"
                ? `Your bid: ${formatMoney(feedback.amount)}`
                : feedback.message}
            </p>
          )}

          <TeamStrip
            teams={state.data.teams}
            maxSquadSize={state.data.auction.maxSquadSize}
            highlightTeamId={team._id}
          />

          <Panel>
            <PanelHeader title="Bids on this player" />
            <BidHistory bids={state.data.bidHistory} limit={8} />
          </Panel>
        </>
      )}

      <Panel>
        <PanelHeader
          title="My squad"
          description={squad.data ? `${squad.data.length} players` : undefined}
        />
        {squad.data?.length ? (
          <ul className="divide-y divide-line">
            {squad.data.map((entry: TeamSquadEntry) => {
              const player = typeof entry.player === "string" ? null : (entry.player as Player);
              return (
                <li
                  key={entry._id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-text">
                      {player?.fullName ?? "Player"}
                    </span>
                    <span className="block text-xs text-muted">{roleLabel(player?.role)}</span>
                  </span>
                  <span className="shrink-0 text-sm text-amber tabular">
                    {entry.acquisitionType === "RETAINED"
                      ? "Retained"
                      : formatMoney(entry.soldPrice)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted">No players bought yet.</p>
        )}
      </Panel>

      <Button variant="ghost" onClick={logout} className="self-center">
        <LogOut className="size-4" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}
