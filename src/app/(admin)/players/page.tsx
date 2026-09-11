"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, UserSquare2 } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/modal";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { playersApi, type PlayerListParams } from "@/lib/api/players";
import { teamsApi } from "@/lib/api/teams";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { formatMoney, roleLabel, titleCase } from "@/lib/utils";
import { PlayerFormModal } from "./player-form-modal";
import type { Player } from "@/types";

const PAGE_SIZE = 20;

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function toPrice(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function PlayersPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [tournament, setTournament] = useState("");
  const [team, setTeam] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("fullName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Player | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const debouncedMin = useDebouncedValue(minPrice);
  const debouncedMax = useDebouncedValue(maxPrice);

  /**
   * The server owns filtering, sorting and paging, so every filter change has
   * to drop you back onto page one before the next request goes out.
   */
  function withPageReset<T>(
    setter: React.Dispatch<React.SetStateAction<T>>
  ): (value: T) => void {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const changeSearch = withPageReset(setSearch);
  const changeRole = withPageReset(setRole);
  const changeCategory = withPageReset(setCategory);
  const changeTeam = withPageReset(setTeam);
  const changeMinPrice = withPageReset(setMinPrice);
  const changeMaxPrice = withPageReset(setMaxPrice);
  const changeSortBy = withPageReset(setSortBy);
  const changeSortOrder = withPageReset(setSortOrder);

  function changeTournament(value: string) {
    setTournament(value);
    setTeam("");
    setPage(1);
  }

  const params = useMemo<PlayerListParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      role: role || undefined,
      category: category || undefined,
      tournament: tournament || undefined,
      team: team || undefined,
      minPrice: toPrice(debouncedMin),
      maxPrice: toPrice(debouncedMax),
      sortBy,
      sortOrder,
    }),
    [
      page,
      debouncedSearch,
      role,
      category,
      tournament,
      team,
      debouncedMin,
      debouncedMax,
      sortBy,
      sortOrder,
    ]
  );

  const players = useQuery({
    queryKey: queryKeys.playerList(params),
    queryFn: () => playersApi.list(params),
    placeholderData: (previous) => previous,
  });

  const tournaments = useQuery({
    queryKey: queryKeys.tournamentList({ limit: 100 }),
    queryFn: () => tournamentsApi.list({ limit: 100 }),
  });

  const teams = useQuery({
    queryKey: queryKeys.teamList({ limit: 100, tournament: tournament || undefined }),
    queryFn: () =>
      teamsApi.list({ limit: 100, tournament: tournament || undefined }),
  });

  const remove = useToastMutation({
    mutationFn: (playerId: string) => playersApi.remove(playerId),
    successMessage: "Player deleted",
    invalidate: [queryKeys.players],
    onSuccess: () => setPendingDelete(null),
  });

  const anyFilter = Boolean(
    debouncedSearch.trim() ||
      role ||
      category ||
      tournament ||
      team ||
      debouncedMin ||
      debouncedMax ||
      sortBy !== "fullName" ||
      sortOrder !== "asc"
  );

  function clearFilters() {
    setSearch("");
    setRole("");
    setCategory("");
    setTournament("");
    setTeam("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("fullName");
    setSortOrder("asc");
    setPage(1);
  }

  const columns: Column<Player>[] = [
    {
      key: "player",
      header: "Player",
      render: (player) => (
        <div className="flex items-center gap-3">
          <PlayerAvatar
            name={player.fullName}
            src={player.profileImage}
            size="sm"
          />
          <div className="min-w-0">
            <Link
              href={`/players/${player._id}`}
              className="truncate font-medium text-text hover:text-amber"
              onClick={(event) => event.stopPropagation()}
            >
              {player.fullName}
            </Link>
            {!player.isActive && (
              <p className="mt-0.5 text-xs text-faint">Inactive</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (player) => (
        <span className="text-muted">{roleLabel(player.role)}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (player) => (
        <Badge tone={player.category === "INTERNATIONAL" ? "sky" : "neutral"}>
          {titleCase(player.category)}
        </Badge>
      ),
    },
    {
      key: "basePrice",
      header: "Base price",
      numeric: true,
      render: (player) => formatMoney(player.basePrice),
    },
    {
      key: "currentTeam",
      header: "Current team",
      render: (player) =>
        player.currentTeam ? (
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: player.currentTeam.color || "#24314c" }}
            />
            <span className="truncate">
              {player.currentTeam.shortName || player.currentTeam.name}
            </span>
          </span>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
    {
      key: "soldPrice",
      header: "Sold price",
      numeric: true,
      render: (player) =>
        player.soldPrice === null || player.soldPrice === undefined ? (
          <span className="text-faint">—</span>
        ) : (
          <span className="text-amber">{formatMoney(player.soldPrice)}</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (player) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit ${player.fullName}`}
            onClick={(event) => {
              event.stopPropagation();
              setEditing(player);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${player.fullName}`}
            onClick={(event) => {
              event.stopPropagation();
              setPendingDelete(player);
            }}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const items = players.data?.items ?? [];
  const meta = players.data?.meta;

  return (
    <>
      <PageHeader
        title="Players"
        description="Everyone on the register, with their base price and where they landed."
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add player
          </Button>
        }
      />

      <Panel className="mb-5">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="sm:col-span-2">
            <Input
              label="Search"
              type="search"
              placeholder="Player name"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
            />
          </div>
          <Select
            label="Role"
            value={role}
            onChange={(event) => changeRole(event.target.value)}
          >
            <option value="">Any role</option>
            <option value="BATTER">Batter</option>
            <option value="BOWLER">Bowler</option>
            <option value="ALL_ROUNDER">All-rounder</option>
            <option value="WICKET_KEEPER">Wicket-keeper</option>
          </Select>
          <Select
            label="Category"
            value={category}
            onChange={(event) => changeCategory(event.target.value)}
          >
            <option value="">Any category</option>
            <option value="LOCAL">Local</option>
            <option value="INTERNATIONAL">International</option>
          </Select>
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
            label="Team"
            value={team}
            onChange={(event) => changeTeam(event.target.value)}
          >
            <option value="">All teams</option>
            {teams.data?.items.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Input
            label="Min base price"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Lakhs"
            className="tabular"
            value={minPrice}
            onChange={(event) => changeMinPrice(event.target.value)}
          />
          <Input
            label="Max base price"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Lakhs"
            className="tabular"
            value={maxPrice}
            onChange={(event) => changeMaxPrice(event.target.value)}
          />
          <Select
            label="Sort by"
            value={sortBy}
            onChange={(event) => changeSortBy(event.target.value)}
          >
            <option value="fullName">Name</option>
            <option value="basePrice">Base price</option>
            <option value="role">Role</option>
          </Select>
          <Select
            label="Order"
            value={sortOrder}
            onChange={(event) =>
              changeSortOrder(event.target.value === "desc" ? "desc" : "asc")
            }
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>
          {anyFilter && (
            <div className="flex items-end">
              <Button variant="ghost" onClick={clearFilters} fullWidth>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <Panel>
        {players.isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : players.isError ? (
          <ErrorState
            title="Couldn't load the players"
            message={(players.error as Error).message}
            onRetry={() => players.refetch()}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={items}
              keyOf={(player) => player._id}
              onRowClick={(player) => router.push(`/players/${player._id}`)}
              className={players.isFetching ? "opacity-60" : undefined}
              emptyState={
                <EmptyState
                  icon={anyFilter ? Search : UserSquare2}
                  title={
                    anyFilter ? "No players match those filters" : "No players yet"
                  }
                  message={
                    anyFilter
                      ? "Widen the price range or clear the filters to see more."
                      : "Add players to the register before you open an auction."
                  }
                  action={
                    anyFilter ? (
                      <Button variant="secondary" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setEditing(null);
                          setFormOpen(true);
                        }}
                      >
                        <Plus className="size-4" aria-hidden />
                        Add player
                      </Button>
                    )
                  }
                />
              }
            />
            {meta && (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Panel>

      <PlayerFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        player={editing}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete._id);
        }}
        title={`Delete ${pendingDelete?.fullName ?? "this player"}?`}
        message="Their record, statistics and auction history are removed. This can't be undone."
        confirmLabel="Delete player"
        loading={remove.isPending}
      />
    </>
  );
}
