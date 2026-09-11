"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Gavel, Users, X } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Button, LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Panel, StatCard } from "@/components/ui/panel";
import { PlayerAvatar, TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { auctionsApi } from "@/lib/api/auctions";
import { queryKeys } from "@/lib/query-keys";
import { formatMoney, roleLabel } from "@/lib/utils";
import type { AuctionPlayer, PlayerRole } from "@/types";

const ROLES: PlayerRole[] = [
  "BATTER",
  "BOWLER",
  "ALL_ROUNDER",
  "WICKET_KEEPER",
];

type ResultsTab = "sold" | "unsold" | "teams";

export default function ResultsPage() {
  return (
    <>
      <PageHeader
        title="Results"
        description="Who went for how much, and what each squad has left in the purse."
      />
      {/* useSearchParams needs a Suspense boundary so the shell above can prerender. */}
      <Suspense fallback={<LoadingState label="Loading results" />}>
        <ResultsView />
      </Suspense>
    </>
  );
}

function ResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [team, setTeam] = useState("");
  const [role, setRole] = useState("");
  const [tab, setTab] = useState<ResultsTab>("sold");

  const auctions = useQuery({
    queryKey: queryKeys.auctionList({}),
    queryFn: () => auctionsApi.list(),
  });

  // Newest first, so the default selection is the auction most likely wanted.
  const auctionOptions = useMemo(() => {
    const items = auctions.data?.items ?? [];
    return [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [auctions.data]);

  const requestedId = searchParams?.get("auction") ?? "";
  const auctionId =
    auctionOptions.find((auction) => auction._id === requestedId)?._id ??
    auctionOptions[0]?._id ??
    "";

  const filters = useMemo(() => {
    const next: { team?: string; role?: string } = {};
    if (team) next.team = team;
    if (role) next.role = role;
    return next;
  }, [team, role]);

  const results = useQuery({
    queryKey: queryKeys.auctionResults(auctionId, filters),
    queryFn: () => auctionsApi.results(auctionId, filters),
    enabled: Boolean(auctionId),
    // Hold the previous auction's data while a new filter loads, so the
    // filter controls don't empty out mid-interaction.
    placeholderData: (previous) => previous,
  });

  function selectAuction(nextId: string) {
    setTeam("");
    setRole("");
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextId) next.set("auction", nextId);
    else next.delete("auction");
    const query = next.toString();
    router.replace(query ? `/results?${query}` : "/results", { scroll: false });
  }

  function clearFilters() {
    setTeam("");
    setRole("");
  }

  const teamWise = results.data?.teamWise ?? [];
  const summary = results.data?.summary;

  // The API filters `sold` server-side. `unsold` comes back whole (unsold
  // players have no buyer), so the role filter is mirrored here for a
  // consistent view — nothing is added, only hidden.
  const sold = results.data?.sold ?? [];
  const unsold = useMemo(() => {
    const list = results.data?.unsold ?? [];
    return role ? list.filter((entry) => entry.player?.role === role) : list;
  }, [results.data, role]);

  const visibleTeams = team
    ? teamWise.filter((entry) => entry.team._id === team)
    : teamWise;

  if (auctions.isLoading) {
    return <LoadingState label="Loading auctions" />;
  }

  if (auctions.isError) {
    return (
      <ErrorState
        message={(auctions.error as Error).message}
        onRetry={() => auctions.refetch()}
      />
    );
  }

  if (auctionOptions.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title="No auctions yet"
        message="Results appear here once an auction exists and players have gone under the hammer."
        action={
          <LinkButton href="/auctions" variant="primary">
            Go to auctions
          </LinkButton>
        }
      />
    );
  }

  const filtersActive = Boolean(team || role);

  return (
    <>
      <Panel className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Auction"
            value={auctionId}
            onChange={(event) => selectAuction(event.target.value)}
          >
            {auctionOptions.map((auction) => (
              <option key={auction._id} value={auction._id}>
                {auction.name}
              </option>
            ))}
          </Select>

          <Select
            label="Team"
            value={team}
            onChange={(event) => setTeam(event.target.value)}
            disabled={teamWise.length === 0}
          >
            <option value="">All teams</option>
            {teamWise.map((entry) => (
              <option key={entry.team._id} value={entry.team._id}>
                {entry.team.name}
              </option>
            ))}
          </Select>

          <Select
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">All roles</option>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {roleLabel(value)}
              </option>
            ))}
          </Select>

          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={clearFilters}
              disabled={!filtersActive}
              fullWidth
              className="sm:w-auto"
            >
              <X className="size-4" aria-hidden />
              Clear filters
            </Button>
          </div>
        </div>
      </Panel>

      {results.isLoading ? (
        <LoadingState label="Loading results" />
      ) : results.isError ? (
        <ErrorState
          message={(results.error as Error).message}
          onRetry={() => results.refetch()}
        />
      ) : !summary ? (
        <EmptyState
          icon={ClipboardList}
          title="No results for this auction"
          message="Pick another auction, or run this one from the console."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Players sold"
              value={summary.totalSold}
              tone={summary.totalSold > 0 ? "pitch" : "default"}
            />
            <StatCard
              label="Unsold"
              value={summary.totalUnsold}
              tone={summary.totalUnsold > 0 ? "ball" : "default"}
            />
            <StatCard
              label="Total spend"
              value={formatMoney(summary.totalAmount)}
              tone="amber"
            />
            <StatCard
              label="Highest buy"
              value={formatMoney(summary.highestBuy?.soldPrice)}
              hint={summary.highestBuy?.player?.fullName}
            />
            <StatCard
              label="Lowest buy"
              value={formatMoney(summary.lowestBuy?.soldPrice)}
              hint={summary.lowestBuy?.player?.fullName}
            />
          </div>

          {filtersActive && (
            <p className="mt-3 text-sm text-faint">
              Filters apply to the lists below. The figures above cover the
              whole auction.
            </p>
          )}

          {summary.totalSold === 0 && summary.totalUnsold === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon={Gavel}
                title="Nothing has gone under the hammer yet"
                message="Once bidding starts, every sale and pass-out lands here."
                action={
                  <LinkButton
                    href={`/auctions/${auctionId}`}
                    variant="primary"
                    size="sm"
                  >
                    Open the console
                  </LinkButton>
                }
              />
            </div>
          ) : (
            <div className="mt-6">
              <Tabs
                tabs={[
                  { value: "sold", label: "Sold", count: sold.length },
                  { value: "unsold", label: "Unsold", count: unsold.length },
                  {
                    value: "teams",
                    label: "Team-wise",
                    count: visibleTeams.length,
                  },
                ]}
                value={tab}
                onChange={(value) => setTab(value as ResultsTab)}
              />

              <div className="mt-5">
                {tab === "sold" && (
                  <Panel>
                    <DataTable
                      columns={SOLD_COLUMNS}
                      rows={sold}
                      keyOf={(row) => row._id}
                      emptyState={
                        <EmptyState
                          icon={ClipboardList}
                          title={
                            filtersActive
                              ? "No sales match these filters"
                              : "No players sold yet"
                          }
                          message={
                            filtersActive
                              ? "Widen the team or role filter to see more."
                              : "Sold players are listed here, highest price first."
                          }
                        />
                      }
                    />
                  </Panel>
                )}

                {tab === "unsold" && (
                  <Panel>
                    {team && (
                      <p className="border-b border-line px-5 py-3 text-sm text-faint">
                        Unsold players have no buyer, so the team filter does
                        not narrow this list.
                      </p>
                    )}
                    <DataTable
                      columns={UNSOLD_COLUMNS}
                      rows={unsold}
                      keyOf={(row) => row._id}
                      emptyState={
                        <EmptyState
                          icon={ClipboardList}
                          title={
                            role
                              ? "No unsold players in this role"
                              : "Every player found a buyer"
                          }
                          message={
                            role
                              ? "Try a different role, or clear the filter."
                              : "Nobody went unsold in this auction."
                          }
                        />
                      }
                    />
                  </Panel>
                )}

                {tab === "teams" &&
                  (visibleTeams.length === 0 ? (
                    <Panel>
                      <EmptyState
                        icon={Users}
                        title="No teams to show"
                        message="This auction's tournament has no teams set up yet."
                      />
                    </Panel>
                  ) : (
                    <div className="grid gap-5 2xl:grid-cols-2">
                      {visibleTeams.map((entry) => {
                        const players = role
                          ? entry.players.filter(
                              (player) => player.player?.role === role
                            )
                          : entry.players;

                        return (
                          <Panel key={entry.team._id}>
                            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <TeamCrest
                                  name={entry.team.name}
                                  src={entry.team.logo}
                                  color={entry.team.color}
                                />
                                <div className="min-w-0">
                                  <h2 className="display truncate text-lg text-text">
                                    {entry.team.name}
                                  </h2>
                                  <p className="mt-0.5 text-sm text-muted">
                                    <span className="tabular">
                                      {entry.playerCount}
                                    </span>{" "}
                                    {entry.playerCount === 1
                                      ? "player"
                                      : "players"}{" "}
                                    bought
                                  </p>
                                </div>
                              </div>
                              <dl className="flex gap-6">
                                <div>
                                  <dt className="text-sm text-muted">Spent</dt>
                                  <dd className="display mt-0.5 text-xl leading-none text-amber tabular">
                                    {formatMoney(entry.totalSpent)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-sm text-muted">
                                    Purse left
                                  </dt>
                                  <dd className="display mt-0.5 text-xl leading-none text-text tabular">
                                    {formatMoney(entry.remainingBudget)}
                                  </dd>
                                </div>
                              </dl>
                            </header>

                            <DataTable
                              columns={TEAM_SQUAD_COLUMNS}
                              rows={players}
                              keyOf={(row) => row._id}
                              emptyState={
                                <EmptyState
                                  icon={Users}
                                  title={
                                    entry.playerCount === 0
                                      ? "Bought nobody"
                                      : "No players in this role"
                                  }
                                  message={
                                    entry.playerCount === 0
                                      ? "This squad did not win a single bid."
                                      : "Clear the role filter to see the full squad."
                                  }
                                  className="py-10"
                                />
                              }
                            />
                          </Panel>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function PlayerCell({ row }: { row: AuctionPlayer }) {
  const name = row.player?.fullName ?? "Unknown player";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <PlayerAvatar name={name} src={row.player?.profileImage} size="sm" />
      <span className="truncate font-medium text-text">{name}</span>
    </div>
  );
}

const SOLD_COLUMNS: Column<AuctionPlayer>[] = [
  {
    key: "player",
    header: "Player",
    render: (row) => <PlayerCell row={row} />,
  },
  {
    key: "role",
    header: "Role",
    render: (row) => (
      <span className="text-muted">{roleLabel(row.player?.role)}</span>
    ),
  },
  {
    key: "team",
    header: "Team",
    render: (row) =>
      row.soldToTeam ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamCrest
            name={row.soldToTeam.name}
            src={row.soldToTeam.logo}
            color={row.soldToTeam.color}
            size="sm"
          />
          <span className="truncate text-text">{row.soldToTeam.name}</span>
        </div>
      ) : (
        <span className="text-faint">—</span>
      ),
  },
  {
    key: "basePrice",
    header: "Base price",
    numeric: true,
    render: (row) => (
      <span className="text-muted">{formatMoney(row.basePrice)}</span>
    ),
  },
  {
    key: "soldPrice",
    header: "Sold price",
    numeric: true,
    render: (row) => (
      <span className="font-semibold text-amber">
        {formatMoney(row.soldPrice)}
      </span>
    ),
  },
];

const UNSOLD_COLUMNS: Column<AuctionPlayer>[] = [
  {
    key: "player",
    header: "Player",
    render: (row) => <PlayerCell row={row} />,
  },
  {
    key: "role",
    header: "Role",
    render: (row) => (
      <span className="text-muted">{roleLabel(row.player?.role)}</span>
    ),
  },
  {
    key: "basePrice",
    header: "Base price",
    numeric: true,
    render: (row) => formatMoney(row.basePrice),
  },
];

const TEAM_SQUAD_COLUMNS: Column<AuctionPlayer>[] = [
  {
    key: "player",
    header: "Player",
    render: (row) => (
      <span className="truncate font-medium text-text">
        {row.player?.fullName ?? "Unknown player"}
      </span>
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (row) => (
      <span className="text-muted">{roleLabel(row.player?.role)}</span>
    ),
  },
  {
    key: "basePrice",
    header: "Base price",
    numeric: true,
    render: (row) => (
      <span className="text-muted">{formatMoney(row.basePrice)}</span>
    ),
  },
  {
    key: "soldPrice",
    header: "Sold price",
    numeric: true,
    render: (row) => (
      <span className="font-semibold text-amber">
        {formatMoney(row.soldPrice)}
      </span>
    ),
  },
];
