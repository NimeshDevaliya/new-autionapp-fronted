"use client";

import { Gavel, XCircle, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import type { AuctionPlayer, AuctionTeamState } from "@/types";

/**
 * The centre column: the bid figure is the loudest element in the product, and
 * the only place the design raises its voice.
 */
export function BidPanel({
  currentPlayer,
  nextBid,
  leadingTeam,
  canAct,
  onSell,
  onUnsold,
  onNext,
  selling,
  markingUnsold,
  movingNext,
}: {
  currentPlayer: AuctionPlayer | null;
  nextBid: number | null;
  leadingTeam: AuctionTeamState | null;
  canAct: boolean;
  onSell: () => void;
  onUnsold: () => void;
  onNext: () => void;
  selling: boolean;
  markingUnsold: boolean;
  movingNext: boolean;
}) {
  if (!currentPlayer) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-line bg-surface px-6 py-14 text-center">
        <Gavel className="size-8 text-faint" aria-hidden />
        <div>
          <p className="display text-2xl">No player under the hammer</p>
          <p className="mt-1 text-sm text-muted">
            Bring the next player up to start taking bids.
          </p>
        </div>
        <Button variant="primary" onClick={onNext} loading={movingNext} disabled={!canAct}>
          <SkipForward className="size-4" aria-hidden />
          Next player
        </Button>
      </div>
    );
  }

  const hasBid = currentPlayer.currentBid > 0;

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-surface">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-sm text-muted">
          {hasBid ? "Current bid" : "Opening bid"}
        </p>

        <p
          key={currentPlayer.currentBid}
          className="display animate-bid-land mt-2 text-7xl leading-none text-amber tabular sm:text-8xl"
        >
          {formatMoney(hasBid ? currentPlayer.currentBid : currentPlayer.basePrice)}
        </p>

        <div className="mt-4 min-h-12">
          {leadingTeam ? (
            <div className="flex items-center justify-center gap-2.5">
              <span
                className="size-3 rounded-sm"
                style={{ backgroundColor: leadingTeam.color ?? "#24314c" }}
                aria-hidden
              />
              <span className="display text-2xl text-text">{leadingTeam.name}</span>
            </div>
          ) : (
            <p className="text-muted">Waiting for the first bid</p>
          )}
        </div>

        {nextBid !== null && (
          <p className="mt-3 text-sm text-muted">
            Next bid <span className="text-text tabular">{formatMoney(nextBid)}</span>
          </p>
        )}
      </div>

      <div className="grid gap-2 border-t border-line p-4 sm:grid-cols-2">
        <Button
          variant="success"
          size="lg"
          onClick={onSell}
          loading={selling}
          disabled={!canAct || !hasBid}
        >
          <Gavel className="size-5" aria-hidden />
          Sell
        </Button>
        <Button
          variant="danger"
          size="lg"
          onClick={onUnsold}
          loading={markingUnsold}
          disabled={!canAct}
        >
          <XCircle className="size-5" aria-hidden />
          Unsold
        </Button>
      </div>
    </div>
  );
}
