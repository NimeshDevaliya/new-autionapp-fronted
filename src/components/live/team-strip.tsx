"use client";

import { TeamCrest } from "@/components/ui/avatar";
import { cn, formatMoney } from "@/lib/utils";
import type { AuctionTeamState } from "@/types";

/** Every team's purse at a glance. The amber ring plus "Leading" marks the high bidder. */
export function TeamStrip({
  teams,
  maxSquadSize,
  highlightTeamId,
}: {
  teams: AuctionTeamState[];
  maxSquadSize: number;
  highlightTeamId?: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {teams.map((team) => {
        const mine = team._id === highlightTeamId;
        return (
          <li
            key={team._id}
            className={cn(
              "rounded-xl border bg-surface p-3",
              team.isHighestBidder ? "border-amber ring-1 ring-amber/40" : "border-line",
              mine && "bg-surface-2"
            )}
          >
            <div className="flex items-center gap-2">
              <TeamCrest name={team.name} src={team.logo} color={team.color} size="sm" />
              <span className="min-w-0 truncate text-sm font-medium text-text">
                {team.shortName ?? team.name}
              </span>
            </div>
            <p className="display mt-2 text-xl text-amber tabular">
              {formatMoney(team.remainingBudget)}
            </p>
            <p className="mt-0.5 flex items-center justify-between text-xs text-muted">
              <span className="tabular">
                {team.playersBought ?? 0}/{Math.min(team.maxPlayers, maxSquadSize)}
              </span>
              {team.isHighestBidder && <span className="text-amber">Leading</span>}
              {mine && !team.isHighestBidder && <span className="text-sky">You</span>}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
