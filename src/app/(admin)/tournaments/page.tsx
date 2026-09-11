"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { Pagination } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { tournamentsApi, type TournamentListParams } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { TournamentCard } from "./_components/tournament-card";
import { TournamentFormModal } from "./_components/tournament-form-modal";
import { useDebouncedValue } from "./_lib/use-debounced-value";

const PAGE_SIZE = 12;

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
];

export default function TournamentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  // a new search or filter starts a new result set — page 2 of the old one is meaningless
  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const params = useMemo<TournamentListParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(status !== "all" ? { status } : {}),
    }),
    [page, debouncedSearch, status]
  );

  const tournaments = useQuery({
    queryKey: queryKeys.tournamentList(params),
    queryFn: () => tournamentsApi.list(params),
    placeholderData: keepPreviousData,
  });

  const create = useToastMutation({
    mutationFn: tournamentsApi.create,
    successMessage: (tournament) => `${tournament.name} created`,
    invalidate: [queryKeys.tournaments],
    onSuccess: () => setCreateOpen(false),
  });

  const filtered = debouncedSearch.trim().length > 0 || status !== "all";
  const items = tournaments.data?.items ?? [];
  const meta = tournaments.data?.meta;

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Tournaments"
        description="Every series and season you run, with squads and auctions attached."
        action={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New tournament
          </Button>
        }
      />

      <Panel className="mb-5" as="div">
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <Input
            label="Search tournaments"
            type="search"
            placeholder="Name, series or season"
            autoComplete="off"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
          />
          <Select
            label="Status"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      {tournaments.isLoading ? (
        <LoadingState label="Loading tournaments" />
      ) : tournaments.isError ? (
        <ErrorState
          message={tournaments.error.message}
          onRetry={() => tournaments.refetch()}
        />
      ) : items.length === 0 ? (
        <Panel>
          {filtered ? (
            <EmptyState
              icon={Trophy}
              title="No tournaments match"
              message="Try a different search term, or clear the filters to see everything."
              action={
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Trophy}
              title="No tournaments yet"
              message="Create your first tournament to start adding teams, players and an auction."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="size-4" aria-hidden />
                  New tournament
                </Button>
              }
            />
          )}
        </Panel>
      ) : (
        <>
          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-busy={tournaments.isFetching || undefined}
          >
            {items.map((tournament) => (
              <TournamentCard key={tournament._id} tournament={tournament} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface [&>nav]:border-t-0">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <TournamentFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => create.mutate(input)}
        submitting={create.isPending}
        title="New tournament"
        submitLabel="Create tournament"
      />
    </>
  );
}
