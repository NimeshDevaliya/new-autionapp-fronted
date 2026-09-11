"use client";

import { Gavel } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import type { Tournament } from "@/types";

export function AuctionTab({ tournament }: { tournament: Tournament }) {
  const auction = tournament.auction;

  if (!auction) {
    return (
      <Panel>
        <EmptyState
          icon={Gavel}
          title="No auction yet"
          message="An auction hasn't been created for this tournament. Set one up from the auctions area once teams and players are in place."
          action={
            <LinkButton href="/auctions" variant="primary" size="sm">
              Go to auctions
            </LinkButton>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Auction"
        description="The auction attached to this tournament."
      />
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3.5">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-amber"
            aria-hidden
          >
            <Gavel className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="display text-lg leading-tight text-text">{auction.name}</p>
            <div className="mt-1">
              <StatusBadge status={auction.status} />
            </div>
          </div>
        </div>
        <LinkButton href={`/auctions/${auction._id}`} variant="primary">
          Open auction
        </LinkButton>
      </div>
    </Panel>
  );
}
