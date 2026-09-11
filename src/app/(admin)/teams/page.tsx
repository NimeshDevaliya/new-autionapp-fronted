"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { TeamCrest } from "@/components/ui/avatar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/table";
import { teamsApi, type TeamListParams } from "@/lib/api/teams";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { formatMoney } from "@/lib/utils";
import { DEFAULT_TEAM_COLOR, TeamFormModal } from "./team-form-modal";
import type { Team } from "@/types";

const PAGE_SIZE = 12;

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** Spent against the purse, drawn in the team's own colour. */
function PurseBar({ team }: { team: Team }) {
  const spentShare =
    team.budget > 0 ? Math.min(100, (team.spent / team.budget) * 100) : 0;
  const color = team.color || DEFAULT_TEAM_COLOR;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted">Purse left</span>
        <span className="display text-lg leading-none text-amber tabular">
          {formatMoney(team.remainingBudget)}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
        role="img"
        aria-label={`${formatMoney(team.spent)} of ${formatMoney(
          team.budget
        )} spent`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${spentShare}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-faint tabular">
        <span>
          {formatMoney(team.spent)} of {formatMoney(team.budget)} spent
        </span>
        <span>
          {team.playersBought ?? 0}/{team.maxPlayers} players
        </span>
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [tournament, setTournament] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  // any filter change puts you back on the first page of results
  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeTournament(value: string) {
    setTournament(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setTournament("");
    setStatus("");
    setPage(1);
  }

  const params = useMemo<TeamListParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      tournament: tournament || undefined,
      status: status || undefined,
    }),
    [page, debouncedSearch, tournament, status]
  );

  const teams = useQuery({
    queryKey: queryKeys.teamList(params),
    queryFn: () => teamsApi.list(params),
    placeholderData: (previous) => previous,
  });

  const tournaments = useQuery({
    queryKey: queryKeys.tournamentList({ limit: 100 }),
    queryFn: () => tournamentsApi.list({ limit: 100 }),
  });

  const filtered = Boolean(debouncedSearch.trim() || tournament || status);
  const items = teams.data?.items ?? [];
  const meta = teams.data?.meta;

  return (
    <>
      <PageHeader
        title="Teams"
        description="Franchises, their purses and how much of it is still in hand."
        action={
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New team
          </Button>
        }
      />

      <Panel className="mb-5">
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <Input
            label="Search"
            type="search"
            placeholder="Team or owner name"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
          />
          <Select
            label="Tournament"
            value={tournament}
            onChange={(event) => changeTournament(event.target.value)}
          >
            <option value="">All tournaments</option>
            {tournaments.data?.items.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
          >
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          {filtered && (
            <div className="flex items-end">
              <Button variant="ghost" fullWidth onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Panel>

      {teams.isLoading ? (
        <LoadingState label="Loading teams" />
      ) : teams.isError ? (
        <ErrorState
          title="Couldn't load the teams"
          message={(teams.error as Error).message}
          onRetry={() => teams.refetch()}
        />
      ) : items.length === 0 ? (
        <Panel>
          <EmptyState
            icon={filtered ? Search : Users}
            title={filtered ? "No teams match those filters" : "No teams yet"}
            message={
              filtered
                ? "Loosen the search or pick a different tournament."
                : "Add the first franchise and give it a purse to bid with."
            }
            action={
              filtered ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setFormOpen(true)}
                >
                  <Plus className="size-4" aria-hidden />
                  New team
                </Button>
              )
            }
          />
        </Panel>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((team) => (
              <li key={team._id}>
                <Link
                  href={`/teams/${team._id}`}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong hover:bg-surface-2"
                >
                  <span
                    aria-hidden
                    className="h-1 w-full"
                    style={{ backgroundColor: team.color || DEFAULT_TEAM_COLOR }}
                  />
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="flex items-start gap-3">
                      <TeamCrest
                        name={team.name}
                        src={team.logo}
                        color={team.color}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="display truncate text-lg leading-tight text-text">
                          {team.name}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted">
                          {team.shortName ? `${team.shortName} · ` : ""}
                          {team.ownerName || "Owner to be confirmed"}
                        </p>
                        {/* the same franchise runs in several seasons, so name
                            the tournament to tell those entries apart */}
                        {typeof team.tournament === "object" &&
                          team.tournament?.name && (
                            <p className="mt-0.5 truncate text-xs text-faint">
                              {team.tournament.name}
                            </p>
                          )}
                      </div>
                      <StatusBadge status={team.status} />
                    </div>

                    <div className="mt-auto">
                      <PurseBar team={team} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {meta && meta.totalPages > 1 && (
            <Panel className="mt-4">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            </Panel>
          )}
        </>
      )}

      <TeamFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultTournament={tournament || undefined}
      />
    </>
  );
}
