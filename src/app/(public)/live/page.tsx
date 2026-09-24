"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { auctionsApi } from "@/lib/api/auctions";
import { queryKeys } from "@/lib/query-keys";
import type { Auction } from "@/types";

const ORDER: Record<Auction["status"], number> = { LIVE: 0, PAUSED: 1, DRAFT: 2, COMPLETED: 3 };

export default function LiveIndexPage() {
  const auctions = useQuery({
    queryKey: queryKeys.auctionList({ scope: "live-board" }),
    queryFn: () => auctionsApi.list(),
    refetchInterval: 15_000,
  });

  if (auctions.isLoading) return <LoadingState label="Finding auctions" />;
  if (auctions.isError) {
    return (
      <ErrorState
        title="Couldn't load auctions"
        message={(auctions.error as Error).message}
        onRetry={() => auctions.refetch()}
      />
    );
  }

  const items = [...(auctions.data?.items ?? [])].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status]
  );
  if (items.length === 0) {
    return (
      <EmptyState
        title="No auctions yet"
        message="Check back when the league announces one."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((auction) => (
        <li key={auction._id}>
          <Link
            href={`/live/${auction._id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-4 transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <span className="min-w-0">
              <span className="display block truncate text-xl text-text">{auction.name}</span>
              <span className="mt-1 block text-sm text-muted">
                {auction.counts
                  ? `${auction.counts.sold} sold · ${auction.counts.pending} to go`
                  : "Tap to watch"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <StatusBadge status={auction.status} />
              <ChevronRight className="size-5 text-muted" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
