"use client";

import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatMoney, roleLabel } from "@/lib/utils";
import type { AuctionPlayer, Bid } from "@/types";

export function AuctionPlayerCard({
  auctionPlayer,
}: {
  auctionPlayer: AuctionPlayer;
}) {
  const player = auctionPlayer.player;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start gap-4">
        <PlayerAvatar
          name={player.fullName}
          src={player.profileImage}
          size="xl"
          className="rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <h2 className="display text-3xl leading-tight text-text">
            {player.fullName}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="sky">{roleLabel(player.role)}</Badge>
            {player.category === "INTERNATIONAL" && (
              <Badge tone="amber">International</Badge>
            )}
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
        <div className="bg-surface-2 px-3 py-2.5">
          <dt className="text-xs text-muted">Base price</dt>
          <dd className="display mt-0.5 text-xl text-text tabular">
            {formatMoney(auctionPlayer.basePrice)}
          </dd>
        </div>
        <div className="bg-surface-2 px-3 py-2.5">
          <dt className="text-xs text-muted">Batting</dt>
          <dd className="mt-0.5 truncate text-sm text-text">
            {player.battingStyle ?? "—"}
          </dd>
        </div>
        <div className="bg-surface-2 px-3 py-2.5">
          <dt className="text-xs text-muted">Bowling</dt>
          <dd className="mt-0.5 truncate text-sm text-text">
            {player.bowlingStyle ?? "—"}
          </dd>
        </div>
        <div className="bg-surface-2 px-3 py-2.5">
          <dt className="text-xs text-muted">Queue position</dt>
          <dd className="mt-0.5 text-sm text-text tabular">#{auctionPlayer.order}</dd>
        </div>
      </dl>
    </div>
  );
}

export function BidHistory({ bids, limit }: { bids: Bid[]; limit?: number }) {
  const rows = limit ? bids.slice(0, limit) : bids;

  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-muted">
        No bids on this player yet.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-line">
      {rows.map((bid, index) => (
        <li
          key={bid._id}
          className="flex items-center justify-between gap-3 px-4 py-2.5"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: bid.team?.color ?? "#24314c" }}
              aria-hidden
            />
            <span className="truncate text-sm text-text">
              {bid.team?.name ?? "Unknown team"}
            </span>
            {bid.source === "TEAM" && <Badge tone="sky">Team app</Badge>}
          </span>
          <span
            className={`shrink-0 text-sm tabular ${
              index === 0 ? "font-semibold text-amber" : "text-muted"
            }`}
          >
            {formatMoney(bid.amount)}
          </span>
        </li>
      ))}
    </ol>
  );
}
