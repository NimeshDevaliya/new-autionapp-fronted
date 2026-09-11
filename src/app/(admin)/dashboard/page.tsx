"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Gavel, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Panel, PanelHeader, StatCard } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { statisticsApi } from "@/lib/api/statistics";
import { tournamentsApi } from "@/lib/api/tournaments";
import { auctionsApi } from "@/lib/api/auctions";
import { queryKeys } from "@/lib/query-keys";
import { formatDateRange, formatMoney } from "@/lib/utils";

export default function DashboardPage() {
  const stats = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: statisticsApi.dashboard,
  });

  const tournaments = useQuery({
    queryKey: queryKeys.tournamentList({ limit: 4 }),
    queryFn: () => tournamentsApi.list({ limit: 4 }),
  });

  const auctions = useQuery({
    queryKey: queryKeys.auctionList({ limit: 5 }),
    queryFn: () => auctionsApi.list(),
  });

  if (stats.isLoading) return <LoadingState label="Loading dashboard" />;
  if (stats.isError) {
    return (
      <ErrorState
        message={(stats.error as Error).message}
        onRetry={() => stats.refetch()}
      />
    );
  }

  const data = stats.data!;
  const liveAuction = auctions.data?.items.find(
    (auction) => auction.status === "LIVE" || auction.status === "PAUSED"
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything happening across the league right now."
        action={
          liveAuction ? (
            <LinkButton href={`/auctions/${liveAuction._id}`} variant="primary">
              <Gavel className="size-4" aria-hidden />
              Open live auction
            </LinkButton>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tournaments" value={data.totalTournaments} />
        <StatCard
          label="Active now"
          value={data.activeTournaments}
          tone={data.activeTournaments > 0 ? "pitch" : "default"}
        />
        <StatCard label="Teams" value={data.totalTeams} />
        <StatCard label="Players" value={data.totalPlayers} />
        <StatCard label="Auctions" value={data.totalAuctions} />
        <StatCard label="Players sold" value={data.soldPlayers} tone="pitch" />
        <StatCard label="Unsold" value={data.unsoldPlayers} tone="ball" />
        <StatCard
          label="Auction spend"
          value={formatMoney(data.totalAuctionAmount)}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Tournaments"
            action={
              <Link
                href="/tournaments"
                className="text-sm text-sky hover:underline"
              >
                View all
              </Link>
            }
          />
          {tournaments.isLoading ? (
            <LoadingState className="py-10" />
          ) : tournaments.data?.items.length ? (
            <ul className="divide-y divide-line">
              {tournaments.data.items.map((tournament) => (
                <li key={tournament._id}>
                  <Link
                    href={`/tournaments/${tournament._id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">
                        {tournament.name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {formatDateRange(tournament.startDate, tournament.endDate)}
                      </p>
                    </div>
                    <StatusBadge status={tournament.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No tournaments yet"
              message="Create your first tournament to start building squads."
              action={
                <LinkButton href="/tournaments" variant="primary" size="sm">
                  Create tournament
                </LinkButton>
              }
            />
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Auctions"
            action={
              <Link href="/auctions" className="text-sm text-sky hover:underline">
                View all
              </Link>
            }
          />
          {auctions.isLoading ? (
            <LoadingState className="py-10" />
          ) : auctions.data?.items.length ? (
            <ul className="divide-y divide-line">
              {auctions.data.items.slice(0, 4).map((auction) => (
                <li key={auction._id}>
                  <Link
                    href={`/auctions/${auction._id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2"
                  >
                    <p className="min-w-0 truncate font-medium text-text">
                      {auction.name}
                    </p>
                    <StatusBadge status={auction.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Gavel}
              title="No auctions yet"
              message="Set up an auction once a tournament has teams and players."
            />
          )}
        </Panel>
      </div>
    </>
  );
}
