"use client";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

/**
 * The one control an owner has. It is huge on purpose: this is tapped on a phone
 * in a noisy hall. `blockedReason` doubles as the disabled explanation.
 */
export function BidButton({
  nextBid,
  blockedReason,
  pending,
  onBid,
}: {
  nextBid: number | null;
  blockedReason: string | null;
  pending: boolean;
  onBid: () => void;
}) {
  const blocked = blockedReason !== null || nextBid === null;
  return (
    <div className="flex flex-col items-stretch gap-2">
      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        className="h-20 text-2xl"
        onClick={onBid}
        disabled={blocked || pending}
        loading={pending}
        aria-label={nextBid !== null ? `Bid ${formatMoney(nextBid)}` : "Bid"}
      >
        {nextBid !== null ? `Bid ${formatMoney(nextBid)}` : "Bid"}
      </Button>
      <p className="min-h-5 text-center text-sm text-muted" aria-live="polite">
        {blockedReason ?? "Tap once — the server confirms your bid."}
      </p>
    </div>
  );
}
