"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { PlayerAvatar, TeamCrest } from "@/components/ui/avatar";
import { searchApi } from "@/lib/api/statistics";
import { queryKeys } from "@/lib/query-keys";
import { formatMoney, roleLabel } from "@/lib/utils";

/** Grouped search over players, teams, tournaments and matches. */
export function GlobalSearch() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);

  // close on outside click and on Escape
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useQuery({
    queryKey: queryKeys.search(debounced),
    queryFn: () => searchApi.global(debounced),
    enabled: debounced.length >= 2,
  });

  const data = results.data;
  const hasResults =
    !!data &&
    (data.players.length > 0 ||
      data.teams.length > 0 ||
      data.tournaments.length > 0 ||
      data.matches.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <label className="sr-only" htmlFor="global-search">
        Search players, teams and tournaments
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
          aria-hidden
        />
        <input
          id="global-search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search players, teams, tournaments"
          className="h-10 w-full rounded-md border border-line-strong bg-ink pl-9 pr-9 text-sm text-text placeholder:text-faint focus:border-amber focus:outline-none"
        />
        {term && (
          <button
            onClick={() => {
              setTerm("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-text"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-line-strong bg-surface py-2">
          {results.isLoading ? (
            <p className="px-4 py-3 text-sm text-muted">Searching…</p>
          ) : !hasResults ? (
            <p className="px-4 py-3 text-sm text-muted">
              Nothing matches “{debounced}”.
            </p>
          ) : (
            <>
              {data.players.length > 0 && (
                <Group title="Players">
                  {data.players.map((player) => (
                    <ResultLink
                      key={player._id}
                      href={`/players/${player._id}`}
                      onNavigate={() => setOpen(false)}
                    >
                      <PlayerAvatar
                        name={player.fullName}
                        src={player.profileImage}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-text">
                          {player.fullName}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {roleLabel(player.role)}
                          {player.currentTeam ? ` · ${player.currentTeam.name}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-amber tabular">
                        {formatMoney(player.basePrice)}
                      </span>
                    </ResultLink>
                  ))}
                </Group>
              )}

              {data.teams.length > 0 && (
                <Group title="Teams">
                  {data.teams.map((team) => (
                    <ResultLink
                      key={team._id}
                      href={`/teams/${team._id}`}
                      onNavigate={() => setOpen(false)}
                    >
                      <TeamCrest
                        name={team.name}
                        src={team.logo}
                        color={team.color}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-text">{team.name}</span>
                        {team.ownerName && (
                          <span className="block truncate text-xs text-muted">
                            {team.ownerName}
                          </span>
                        )}
                      </span>
                    </ResultLink>
                  ))}
                </Group>
              )}

              {data.tournaments.length > 0 && (
                <Group title="Tournaments">
                  {data.tournaments.map((tournament) => (
                    <ResultLink
                      key={tournament._id}
                      href={`/tournaments/${tournament._id}`}
                      onNavigate={() => setOpen(false)}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-text">
                          {tournament.name}
                        </span>
                        {tournament.location && (
                          <span className="block truncate text-xs text-muted">
                            {tournament.location}
                          </span>
                        )}
                      </span>
                    </ResultLink>
                  ))}
                </Group>
              )}

              {data.matches.length > 0 && (
                <Group title="Matches">
                  {data.matches.map((match) => (
                    <ResultLink
                      key={match._id}
                      href={`/tournaments/${
                        typeof match.tournament === "string"
                          ? match.tournament
                          : match.tournament?._id
                      }`}
                      onNavigate={() => setOpen(false)}
                    >
                      <span className="min-w-0 flex-1 truncate text-text">
                        {match.teamA?.name} vs {match.teamB?.name}
                      </span>
                      {match.venue && (
                        <span className="shrink-0 truncate text-xs text-muted">
                          {match.venue}
                        </span>
                      )}
                    </ResultLink>
                  ))}
                </Group>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-4 py-1 text-xs font-medium text-faint">{title}</p>
      <ul>{children}</ul>
    </div>
  );
}

function ResultLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-surface-2"
      >
        {children}
      </Link>
    </li>
  );
}
