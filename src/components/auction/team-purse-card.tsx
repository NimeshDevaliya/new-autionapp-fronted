"use client";

import { cn, formatMoney } from "@/lib/utils";
import { TeamCrest } from "@/components/ui/avatar";
import type { AuctionTeamState } from "@/types";

/**
 * One team in the bidding rail. The colour bar is the team's identity, the
 * amber ring plus the "Leading" label marks the current high bidder — state is
 * never carried by colour alone.
 */
export function TeamPurseCard({
  team,
  nextBid,
  maxSquadSize,
  onBid,
  disabled,
  pending,
}: {
  team: AuctionTeamState;
  nextBid: number | null;
  maxSquadSize: number;
  onBid: () => void;
  disabled: boolean;
  pending: boolean;
}) {
  const squadFull = (team.playersBought ?? 0) >= Math.min(team.maxPlayers, maxSquadSize);
  const cantAfford = nextBid !== null && nextBid > team.remainingBudget;
  const inactive = team.status !== "ACTIVE";
  const blocked = disabled || squadFull || cantAfford || inactive || team.isHighestBidder;

  const reason = inactive
    ? "Not active"
    : squadFull
      ? "Squad full"
      : cantAfford
        ? "Not enough purse"
        : team.isHighestBidder
          ? "Leading"
          : null;

  return (
    <button
      type="button"
      onClick={onBid}
      disabled={blocked || pending}
      aria-label={`Bid ${nextBid ? formatMoney(nextBid) : ""} for ${team.name}`}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors",
        team.isHighestBidder
          ? "border-amber ring-1 ring-amber/40"
          : "border-line hover:border-line-strong hover:bg-surface-2",
        blocked && "opacity-55",
        !blocked && !pending && "cursor-pointer"
      )}
    >
      <span
        className="h-10 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: team.color ?? "#24314c" }}
        aria-hidden
      />
      <TeamCrest name={team.name} src={team.logo} color={team.color} size="sm" />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium text-text">{team.name}</span>
          <span className="shrink-0 text-sm text-amber tabular">
            {formatMoney(team.remainingBudget)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted">
          <span className="tabular">
            {team.playersBought ?? 0}/{Math.min(team.maxPlayers, maxSquadSize)} players
          </span>
          {reason && (
            <span className={cn(team.isHighestBidder ? "text-amber" : "text-faint")}>
              {reason}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
