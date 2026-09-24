"use client";

import { PlayerAvatar, TeamCrest } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { cn, formatMoney, roleLabel } from "@/lib/utils";
import type { Auction, AuctionPlayer, Team } from "@/types";

export type LotFlash =
  | { kind: "SOLD"; team?: string; price?: number }
  | { kind: "UNSOLD" };

function idleMessage(status: Auction["status"]): string {
  switch (status) {
    case "DRAFT":
      return "The auction hasn't started yet.";
    case "COMPLETED":
      return "The auction is over. Thanks for watching.";
    case "PAUSED":
      return "The auction is paused.";
    default:
      return "Waiting for the next player…";
  }
}

/**
 * The lot everyone is looking at: player, current bid, who leads. Sized for a
 * projector first — the amount is the biggest thing on the screen.
 */
export function LotCard({
  auction,
  currentPlayer,
  nextBid,
  leadingTeam,
  flash,
}: {
  auction: Auction;
  currentPlayer: AuctionPlayer | null;
  nextBid: number | null;
  leadingTeam: Pick<Team, "_id" | "name" | "shortName" | "logo" | "color"> | null;
  flash?: LotFlash | null;
}) {
  const hasBid = !!currentPlayer && currentPlayer.currentBid > 0;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface p-6 sm:p-8",
        auction.status === "PAUSED" ? "border-amber/50" : "border-line"
      )}
      aria-live="polite"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="display truncate text-lg text-muted">{auction.name}</h2>
        <StatusBadge status={auction.status} />
      </div>

      {!currentPlayer ? (
        <p className="py-14 text-center text-xl text-muted">{idleMessage(auction.status)}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <PlayerAvatar
            name={currentPlayer.player.fullName}
            src={currentPlayer.player.profileImage}
            size="xl"
            className="size-32 rounded-xl text-3xl sm:size-40"
          />
          <div className="min-w-0">
            <h3 className="display text-4xl leading-tight text-text sm:text-5xl">
              {currentPlayer.player.fullName}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="sky">{roleLabel(currentPlayer.player.role)}</Badge>
              {currentPlayer.player.category === "INTERNATIONAL" && (
                <Badge tone="amber">International</Badge>
              )}
              <Badge tone="neutral">Base {formatMoney(currentPlayer.basePrice)}</Badge>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted">
                  {hasBid ? "Current bid" : "Opening bid"}
                </p>
                <p className="display text-6xl leading-none text-amber tabular sm:text-7xl">
                  {formatMoney(hasBid ? currentPlayer.currentBid : currentPlayer.basePrice)}
                </p>
              </div>
              {nextBid !== null && auction.status === "LIVE" && (
                <div>
                  <p className="text-sm text-muted">Next bid</p>
                  <p className="display text-2xl text-text tabular">{formatMoney(nextBid)}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              {leadingTeam ? (
                <>
                  <TeamCrest
                    name={leadingTeam.name}
                    src={leadingTeam.logo}
                    color={leadingTeam.color}
                    size="md"
                  />
                  <span className="text-lg text-text">
                    <span className="text-muted">Leading: </span>
                    {leadingTeam.name}
                  </span>
                </>
              ) : (
                <span className="text-lg text-muted">No bids yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      {flash && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center bg-ink/85 text-center",
            flash.kind === "SOLD" ? "text-pitch" : "text-ball"
          )}
          role="status"
        >
          <p className="display text-6xl sm:text-8xl">{flash.kind}</p>
          {flash.kind === "SOLD" && (
            <p className="mt-2 text-2xl text-text">
              {flash.team ?? "Winning team"} · {formatMoney(flash.price)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
