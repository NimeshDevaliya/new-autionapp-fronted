"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Modal } from "@/components/ui/modal";
import { TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { formatOvers } from "@/components/stats/leaderboard-tables";
import { matchesApi } from "@/lib/api/matches";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { cn, formatDate } from "@/lib/utils";
import type { ImportReport, Match, Team } from "@/types";

/** One side of a result: crest, short name and score, the winner in full weight. */
function SideScore({ team, match, won }: { team: Team; match: Match; won: boolean }) {
  const innings = match.innings?.find((i) => i.team === team._id);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <TeamCrest name={team.name} src={team.logo} color={team.color} size="sm" />
      <span className="min-w-0">
        <span className={cn("block truncate", won ? "font-semibold text-text" : "text-muted")}>
          {team.shortName || team.name}
        </span>
        <span className={cn("block text-sm tabular", won ? "text-text" : "text-muted")}>
          {innings ? (
            <>
              {innings.runs}/{innings.wickets}
              <span className="ml-1 text-xs text-faint">({formatOvers(innings.overs)} ov)</span>
            </>
          ) : (
            <span className="text-faint">—</span>
          )}
        </span>
      </span>
    </span>
  );
}

export function MatchesTab({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [report, setReport] = useState<ImportReport | null>(null);
  const params = { tournament: tournamentId, limit: 100 };

  const matches = useQuery({
    queryKey: queryKeys.matchList(params),
    queryFn: () => matchesApi.list(params),
  });

  const sync = useToastMutation({
    mutationFn: () => tournamentsApi.importCricheroes(tournamentId),
    successMessage: (data) =>
      data.matches.imported > 0
        ? `Imported ${data.matches.imported} match${data.matches.imported === 1 ? "" : "es"}`
        : "Already up to date",
    invalidate: [
      queryKeys.matches,
      queryKeys.tournament(tournamentId),
      queryKeys.tournamentStats(tournamentId),
      queryKeys.pointsTable(tournamentId),
      queryKeys.players,
      queryKeys.teams,
    ],
    onSuccess: (data) => setReport(data),
  });

  const columns: Column<Match>[] = [
    {
      key: "number",
      header: "No.",
      className: "w-14",
      render: (match) => (
        <span className="tabular text-faint">{match.matchNumber ?? "—"}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (match) => (
        <span className="tabular text-muted">{formatDate(match.matchDate)}</span>
      ),
    },
    {
      key: "teams",
      header: "Match",
      className: "min-w-[260px]",
      render: (match) => {
        const winnerId = match.winner?._id;
        return (
          <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <SideScore team={match.teamA} match={match} won={winnerId === match.teamA._id} />
            <span className="text-xs text-faint">v</span>
            <SideScore team={match.teamB} match={match} won={winnerId === match.teamB._id} />
          </span>
        );
      },
    },
    {
      key: "result",
      header: "Result",
      render: (match) => (
        <span className="text-muted">
          {match.result || (match.winner ? `${match.winner.name} won` : "—")}
        </span>
      ),
    },
    {
      key: "pom",
      header: "Player of the match",
      render: (match) =>
        match.playerOfTheMatch ? (
          <span className="text-text">{match.playerOfTheMatch.fullName}</span>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
  ];

  return (
    <>
      <Panel>
        <PanelHeader
          title="Fixtures and results"
          description="Every match in this tournament. Open one for the full scorecard."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => sync.mutate()}
              loading={sync.isPending}
            >
              <RefreshCw className="size-4" aria-hidden />
              {sync.isPending ? "Syncing" : "Sync from CricHeroes"}
            </Button>
          }
        />
        {matches.isError ? (
          <ErrorState message={matches.error.message} onRetry={() => matches.refetch()} />
        ) : matches.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <DataTable
            columns={columns}
            rows={matches.data?.items ?? []}
            keyOf={(match) => match._id}
            onRowClick={(match) => router.push(`/matches/${match._id}`)}
            emptyState={
              <EmptyState
                icon={Swords}
                title="No matches yet"
                message="Sync from CricHeroes to pull this tournament's results, or add matches by hand."
              />
            }
          />
        )}
      </Panel>

      <Modal
        open={report !== null}
        onClose={() => setReport(null)}
        title="Sync complete"
        description={report ? `${report.tournament.name} from CricHeroes #${report.tournament.externalId}` : undefined}
        size="lg"
      >
        {report && <SyncReport report={report} />}
      </Modal>
    </>
  );
}

function SyncReport({ report }: { report: ImportReport }) {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Matches found" value={report.matches.found} />
        <Stat label="Imported" value={report.matches.imported} />
        <Stat label="Players linked" value={report.players.linkedById + report.players.matched.length} />
        <Stat label="Players created" value={report.players.created.length} />
      </dl>

      {report.matches.failed.length > 0 && (
        <section>
          <h3 className="mb-1.5 font-medium text-ball">
            {report.matches.failed.length} match{report.matches.failed.length === 1 ? "" : "es"} failed
          </h3>
          <ul className="list-disc space-y-0.5 pl-5 text-muted">
            {report.matches.failed.map((f) => (
              <li key={f.matchId}>
                #{f.matchId}: {f.error}
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.players.matched.length > 0 && (
        <section>
          <h3 className="mb-1.5 font-medium text-text">Names matched by rule — worth a glance</h3>
          <ul className="space-y-0.5 text-muted">
            {report.players.matched.map((m) => (
              <li key={`${m.cricheroes}-${m.ours}`}>
                <span className="text-text">{m.cricheroes}</span> → {m.ours}{" "}
                <span className="text-xs text-faint">({m.rule})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.players.aliased.length > 0 && (
        <section>
          <h3 className="mb-1.5 font-medium text-text">Duplicate CricHeroes profiles merged</h3>
          <p className="text-muted">{report.players.aliased.map((a) => a.name).join(", ")}</p>
        </section>
      )}

      {report.players.created.length > 0 && (
        <section>
          <h3 className="mb-1.5 font-medium text-text">New players created</h3>
          <p className="text-muted">{report.players.created.join(", ")}</p>
        </section>
      )}

      {report.outsideSquad.length > 0 && (
        <section>
          <h3 className="mb-1.5 font-medium text-text">
            Played for a team they aren&apos;t on the squad of ({report.outsideSquad.length})
          </h3>
          <p className="text-muted">
            {report.outsideSquad.map((o) => `${o.player} (${o.playedFor})`).join(", ")}
          </p>
        </section>
      )}

      {report.warnings.length > 0 && (
        <section>
          <h3 className="mb-1.5 font-medium text-amber">Warnings</h3>
          <ul className="list-disc space-y-0.5 pl-5 text-muted">
            {report.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {report.standings.length > 0 && (
        <section>
          <h3 className="mb-1.5 font-medium text-text">Standings — official vs ours</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead>
                <tr className="text-left text-faint">
                  <th className="py-1 pr-3 font-medium">Team</th>
                  <th className="py-1 pr-3 text-right font-medium">P</th>
                  <th className="py-1 pr-3 text-right font-medium">W</th>
                  <th className="py-1 pr-3 text-right font-medium">Pts</th>
                  <th className="py-1 pr-3 text-right font-medium">NRR</th>
                  <th className="py-1 text-right font-medium">Adj</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {report.standings.map((s) => (
                  <tr key={s.team} className="border-t border-line">
                    <td className="py-1.5 pr-3 text-text">{s.team}</td>
                    <td className="py-1.5 pr-3 text-right text-muted">{s.official.matches}/{s.derived.matches}</td>
                    <td className="py-1.5 pr-3 text-right text-muted">{s.official.won}/{s.derived.wins}</td>
                    <td className="py-1.5 pr-3 text-right text-muted">{s.official.points}/{s.derived.points}</td>
                    <td className="py-1.5 pr-3 text-right text-muted">
                      {s.official.nrr}/{s.derived.nrr === null ? "—" : s.derived.nrr.toFixed(3)}
                    </td>
                    <td className="py-1.5 text-right text-muted">{s.pointsAdjustment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="display text-2xl text-text tabular">{value}</dd>
    </div>
  );
}
