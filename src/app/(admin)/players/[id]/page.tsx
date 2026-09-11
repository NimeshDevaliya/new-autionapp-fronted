"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink, Gavel, Trophy } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { Panel, StatCard } from "@/components/ui/panel";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { playersApi } from "@/lib/api/players";
import { queryKeys } from "@/lib/query-keys";
import { formatDate, formatMoney, roleLabel, titleCase } from "@/lib/utils";
import type {
  AuctionPlayer,
  PlayerStatistics,
  PlayerStatsResponse,
} from "@/types";

const CAREER = "career";

const TABS: TabItem[] = [
  { value: "overview", label: "Overview" },
  { value: "batting", label: "Batting" },
  { value: "bowling", label: "Bowling" },
  { value: "fielding", label: "Fielding" },
  { value: "seasons", label: "Seasons" },
  { value: "auctions", label: "Auction history" },
];

function whole(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return String(value);
}

function decimal(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

type SeasonEntry = PlayerStatsResponse["seasons"][number];

function seasonLabel(season: SeasonEntry): string {
  const { tournament } = season;
  const name = tournament.seasonName || tournament.name;
  return tournament.status === "ONGOING" ? `${name} — Current season` : name;
}

/** Figures laid out as a grid rather than a table — they read better dense. */
function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-surface px-4 py-3.5">
          <dt className="text-sm text-muted">{item.label}</dt>
          <dd className="display mt-1 text-2xl leading-none text-text tabular">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tab, setTab] = useState("overview");
  const [scope, setScope] = useState<string>(CAREER);

  const player = useQuery({
    queryKey: queryKeys.player(id),
    queryFn: () => playersApi.get(id),
  });

  const stats = useQuery({
    queryKey: queryKeys.playerStats(id),
    queryFn: () => playersApi.statistics(id),
  });

  const seasons = useMemo<SeasonEntry[]>(
    () => stats.data?.seasons ?? [],
    [stats.data]
  );

  const selectedSeason =
    scope === CAREER
      ? null
      : seasons.find((season) => season.tournament._id === scope) ?? null;

  const shown: PlayerStatistics | null = stats.data
    ? selectedSeason
      ? selectedSeason.stats
      : stats.data.career
    : null;

  const scopeLabel = selectedSeason
    ? seasonLabel(selectedSeason)
    : "Career totals";

  if (player.isLoading) return <LoadingState label="Loading the player" />;
  if (player.isError || !player.data) {
    return (
      <ErrorState
        title="Couldn't load this player"
        message={
          player.error
            ? (player.error as Error).message
            : "The player wasn't found."
        }
        onRetry={() => player.refetch()}
      />
    );
  }

  const data = player.data;
  const latestAuction = data.auctionHistory?.[0] ?? null;
  const styles = [data.battingStyle, data.bowlingStyle].filter(Boolean);

  const seasonColumns: Column<SeasonEntry>[] = [
    {
      key: "season",
      header: "Season",
      render: (season) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">
            {season.tournament.seasonName || season.tournament.name}
          </p>
          {season.tournament.seriesName && (
            <p className="mt-0.5 truncate text-xs text-faint">
              {season.tournament.seriesName}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (season) => <StatusBadge status={season.tournament.status} />,
    },
    {
      key: "matches",
      header: "Matches",
      numeric: true,
      render: (season) => whole(season.stats.batting.matches),
    },
    {
      key: "runs",
      header: "Runs",
      numeric: true,
      render: (season) => whole(season.stats.batting.runs),
    },
    {
      key: "wickets",
      header: "Wickets",
      numeric: true,
      render: (season) => whole(season.stats.bowling.wickets),
    },
  ];

  const auctionColumns: Column<AuctionPlayer>[] = [
    {
      key: "auction",
      header: "Auction",
      render: (entry) => (
        <span className="font-medium text-text">
          {typeof entry.auction === "string" ? "Auction" : entry.auction.name}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (entry) => <StatusBadge status={entry.status} />,
    },
    {
      key: "basePrice",
      header: "Base price",
      numeric: true,
      render: (entry) => formatMoney(entry.basePrice),
    },
    {
      key: "soldPrice",
      header: "Sold price",
      numeric: true,
      render: (entry) =>
        entry.soldPrice === null || entry.soldPrice === undefined ? (
          <span className="text-faint">—</span>
        ) : (
          <span className="text-amber">{formatMoney(entry.soldPrice)}</span>
        ),
    },
    {
      key: "team",
      header: "Team",
      render: (entry) =>
        entry.soldToTeam ? (
          <Link
            href={`/teams/${entry.soldToTeam._id}`}
            className="flex items-center gap-2 hover:text-amber"
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.soldToTeam.color || "#24314c" }}
            />
            <span className="truncate">{entry.soldToTeam.name}</span>
          </Link>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <Link
          href="/players"
          className="mt-6 text-muted transition-colors hover:text-text"
          aria-label="Back to players"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>

        <PlayerAvatar
          name={data.fullName}
          src={data.profileImage}
          size="xl"
        />

        <div className="min-w-0 flex-1">
          <h1 className="display text-3xl leading-tight text-text">
            {data.fullName}
          </h1>
          <p className="mt-1 text-muted">
            {roleLabel(data.role)}
            {styles.length > 0 && ` · ${styles.join(" · ")}`}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge tone={data.category === "INTERNATIONAL" ? "sky" : "neutral"}>
              {titleCase(data.category)}
            </Badge>
            {!data.isActive && <Badge tone="ball">Inactive</Badge>}
            {latestAuction && <StatusBadge status={latestAuction.status} />}
            {data.currentTeam ? (
              <Link
                href={`/teams/${data.currentTeam._id}`}
                className="inline-flex items-center gap-2 text-sm text-sky hover:underline"
              >
                <span
                  aria-hidden
                  className="size-2.5 rounded-sm"
                  style={{
                    backgroundColor: data.currentTeam.color || "#24314c",
                  }}
                />
                {data.currentTeam.name}
              </Link>
            ) : (
              <span className="text-sm text-faint">No team</span>
            )}
            {data.dateOfBirth && (
              <span className="text-sm text-faint tabular">
                Born {formatDate(data.dateOfBirth)}
              </span>
            )}
            {data.externalProfileUrl && (
              <a
                href={data.externalProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-sky hover:underline"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Profile
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          <div>
            <p className="text-sm text-muted">Base price</p>
            <p className="display text-2xl leading-none text-text tabular">
              {formatMoney(data.basePrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Sold for</p>
            <p className="display text-2xl leading-none text-amber tabular">
              {data.soldPrice === null || data.soldPrice === undefined
                ? "—"
                : formatMoney(data.soldPrice)}
            </p>
          </div>
        </div>
      </div>

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="display text-lg text-text">{scopeLabel}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {selectedSeason
                ? "Figures for this season only."
                : "Every match on record, across all seasons."}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <Select
              label="Season"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              disabled={stats.isLoading}
            >
              <option value={CAREER}>Career</option>
              {seasons.map((season) => (
                <option
                  key={season.tournament._id}
                  value={season.tournament._id}
                >
                  {seasonLabel(season)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Tabs tabs={TABS} value={tab} onChange={setTab} className="px-3" />

        {stats.isLoading ? (
          <LoadingState label="Loading statistics" />
        ) : stats.isError ? (
          <ErrorState
            title="Couldn't load the statistics"
            message={(stats.error as Error).message}
            onRetry={() => stats.refetch()}
          />
        ) : !shown ? (
          <EmptyState
            title="No statistics on record"
            message="Figures appear once this player has featured in a scored match."
          />
        ) : (
          <div>
            {tab === "overview" && (
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Matches" value={whole(shown.batting.matches)} />
                <StatCard label="Innings" value={whole(shown.batting.innings)} />
                <StatCard
                  label="Runs"
                  value={whole(shown.batting.runs)}
                  tone="amber"
                />
                <StatCard
                  label="Highest score"
                  value={whole(shown.batting.highestScore)}
                />
                <StatCard
                  label="Average"
                  value={decimal(shown.batting.average)}
                />
                <StatCard
                  label="Strike rate"
                  value={decimal(shown.batting.strikeRate)}
                />
                <StatCard
                  label="Wickets"
                  value={whole(shown.bowling.wickets)}
                  tone="pitch"
                />
                <StatCard
                  label="Economy"
                  value={decimal(shown.bowling.economy)}
                />
                <StatCard label="Catches" value={whole(shown.fielding.catches)} />
              </div>
            )}

            {tab === "batting" && (
              <StatGrid
                items={[
                  { label: "Matches", value: whole(shown.batting.matches) },
                  { label: "Innings", value: whole(shown.batting.innings) },
                  { label: "Runs", value: whole(shown.batting.runs) },
                  { label: "Balls faced", value: whole(shown.batting.balls) },
                  { label: "Not outs", value: whole(shown.batting.notOuts) },
                  {
                    label: "Highest score",
                    value: whole(shown.batting.highestScore),
                  },
                  { label: "Average", value: decimal(shown.batting.average) },
                  {
                    label: "Strike rate",
                    value: decimal(shown.batting.strikeRate),
                  },
                  { label: "Fours", value: whole(shown.batting.fours) },
                  { label: "Sixes", value: whole(shown.batting.sixes) },
                  { label: "Fifties", value: whole(shown.batting.fifties) },
                  { label: "Hundreds", value: whole(shown.batting.hundreds) },
                ]}
              />
            )}

            {tab === "bowling" && (
              <StatGrid
                items={[
                  { label: "Innings", value: whole(shown.bowling.innings) },
                  { label: "Overs", value: decimal(shown.bowling.overs, 1) },
                  { label: "Maidens", value: whole(shown.bowling.maidens) },
                  {
                    label: "Runs conceded",
                    value: whole(shown.bowling.runsConceded),
                  },
                  { label: "Wickets", value: whole(shown.bowling.wickets) },
                  { label: "Economy", value: decimal(shown.bowling.economy) },
                  { label: "Average", value: decimal(shown.bowling.average) },
                  {
                    label: "Strike rate",
                    value: decimal(shown.bowling.strikeRate),
                  },
                  {
                    label: "Best bowling",
                    value: shown.bowling.bestBowling || "—",
                  },
                ]}
              />
            )}

            {tab === "fielding" && (
              <StatGrid
                items={[
                  { label: "Catches", value: whole(shown.fielding.catches) },
                  { label: "Stumpings", value: whole(shown.fielding.stumpings) },
                  { label: "Run outs", value: whole(shown.fielding.runOuts) },
                ]}
              />
            )}

            {tab === "seasons" && (
              <DataTable
                columns={seasonColumns}
                rows={seasons}
                keyOf={(season) => season.tournament._id}
                emptyState={
                  <EmptyState
                    icon={Trophy}
                    title="No seasons yet"
                    message="Season figures appear once this player features in a tournament."
                  />
                }
              />
            )}

            {tab === "auctions" && (
              <DataTable
                columns={auctionColumns}
                rows={data.auctionHistory ?? []}
                keyOf={(entry) => entry._id}
                emptyState={
                  <EmptyState
                    icon={Gavel}
                    title="Never been to auction"
                    message="Once this player is entered into an auction, every bid round shows here."
                  />
                }
              />
            )}
          </div>
        )}
      </Panel>

      {tab !== "seasons" && seasons.length > 0 && (
        <p className="mt-3 text-sm text-faint">
          {seasons.length} season{seasons.length === 1 ? "" : "s"} on record —
          switch the season selector or open the Seasons tab to compare them.
        </p>
      )}
    </>
  );
}
