"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  CirclePlay,
  CircleStop,
  Layers,
  MapPin,
  Pencil,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { TeamCrest } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/modal";
import { CricheroesSyncButton } from "@/components/cricheroes/sync-button";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { tournamentsApi, type TournamentInput } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { formatDateRange } from "@/lib/utils";
import { TournamentFormModal } from "../_components/tournament-form-modal";
import { OverviewTab } from "./_components/overview-tab";
import { MatchesTab } from "./_components/matches-tab";
import { TeamsTab } from "./_components/teams-tab";
import { PlayersTab } from "./_components/players-tab";
import { PointsTableTab } from "./_components/points-table-tab";
import { StatisticsTab } from "./_components/statistics-tab";
import { AuctionTab } from "./_components/auction-tab";

type TabValue =
  | "overview"
  | "matches"
  | "teams"
  | "players"
  | "points"
  | "statistics"
  | "auction";

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [tab, setTab] = useState<TabValue>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tournament = useQuery({
    queryKey: queryKeys.tournament(id),
    queryFn: () => tournamentsApi.get(id),
  });

  const invalidate = [queryKeys.tournament(id), queryKeys.tournaments];

  const update = useToastMutation({
    mutationFn: (input: TournamentInput) => tournamentsApi.update(id, input),
    successMessage: "Tournament updated",
    invalidate,
    onSuccess: () => setEditOpen(false),
  });

  const start = useToastMutation({
    mutationFn: () => tournamentsApi.start(id),
    successMessage: "Tournament is now underway",
    invalidate,
  });

  const end = useToastMutation({
    mutationFn: () => tournamentsApi.end(id),
    successMessage: "Tournament marked as completed",
    invalidate,
  });

  const remove = useToastMutation({
    mutationFn: () => tournamentsApi.remove(id),
    successMessage: "Tournament deleted",
    invalidate: [queryKeys.tournaments],
    onSuccess: () => {
      setConfirmDelete(false);
      router.push("/tournaments");
    },
  });

  if (tournament.isLoading) return <LoadingState label="Loading tournament" />;

  if (tournament.isError || !tournament.data) {
    return (
      <>
        <Link
          href="/tournaments"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" aria-hidden />
          All tournaments
        </Link>
        <ErrorState
          title="Tournament not found"
          message={
            tournament.error?.message ??
            "This tournament may have been deleted or the link is wrong."
          }
          onRetry={() => tournament.refetch()}
        />
      </>
    );
  }

  const data = tournament.data;

  const season =
    data.seasonName ?? (data.seasonNumber ? `Season ${data.seasonNumber}` : null);
  const seriesLine = [data.seriesName, season].filter(Boolean).join(" — ");

  const tabs: TabItem[] = [
    { value: "overview", label: "Overview" },
    { value: "matches", label: "Matches", count: data.matchCount },
    { value: "teams", label: "Teams", count: data.teamCount },
    { value: "players", label: "Players", count: data.playerCount },
    { value: "points", label: "Points table" },
    { value: "statistics", label: "Statistics" },
    { value: "auction", label: "Auction" },
  ];

  return (
    <>
      <Link
        href="/tournaments"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ChevronLeft className="size-4" aria-hidden />
        All tournaments
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <TeamCrest
            name={data.shortName || data.name}
            src={data.logo}
            size="lg"
            className="rounded-lg"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="display text-3xl leading-tight text-text">{data.name}</h1>
              <StatusBadge status={data.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-faint" aria-hidden />
                <span className="tabular">
                  {formatDateRange(data.startDate, data.endDate)}
                </span>
              </span>
              {data.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-faint" aria-hidden />
                  {data.location}
                </span>
              )}
              {seriesLine && (
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="size-4 text-faint" aria-hidden />
                  {seriesLine}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.externalId && (
            <CricheroesSyncButton
              tournamentId={id}
              tournamentName={data.name}
              size="md"
            />
          )}
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden />
            Edit
          </Button>
          {data.status === "UPCOMING" && (
            <Button
              variant="success"
              onClick={() => start.mutate(undefined)}
              loading={start.isPending}
            >
              <CirclePlay className="size-4" aria-hidden />
              Start tournament
            </Button>
          )}
          {data.status === "ONGOING" && (
            <Button
              variant="primary"
              onClick={() => end.mutate(undefined)}
              loading={end.isPending}
            >
              <CircleStop className="size-4" aria-hidden />
              End tournament
            </Button>
          )}
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash className="size-4" aria-hidden />
            Delete
          </Button>
        </div>
      </header>

      {data.description && (
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted">
          {data.description}
        </p>
      )}

      <Tabs
        tabs={tabs}
        value={tab}
        onChange={(value) => setTab(value as TabValue)}
        className="mb-5"
      />

      {tab === "overview" && <OverviewTab tournamentId={id} />}
      {tab === "matches" && <MatchesTab tournamentId={id} />}
      {tab === "teams" && <TeamsTab tournamentId={id} />}
      {tab === "players" && <PlayersTab tournamentId={id} />}
      {tab === "points" && <PointsTableTab tournamentId={id} />}
      {tab === "statistics" && <StatisticsTab tournamentId={id} />}
      {tab === "auction" && <AuctionTab tournament={data} />}

      <TournamentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        tournament={data}
        onSubmit={(input) => update.mutate(input)}
        submitting={update.isPending}
        title="Edit tournament"
        submitLabel="Save changes"
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(undefined)}
        title="Delete this tournament?"
        message={`"${data.name}" and its links to teams, players and the auction will be removed. This can't be undone.`}
        confirmLabel="Delete tournament"
        loading={remove.isPending}
      />
    </>
  );
}
