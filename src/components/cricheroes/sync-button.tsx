"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { tournamentsApi } from "@/lib/api/tournaments";
import { queryKeys } from "@/lib/query-keys";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import type { ImportReport } from "@/types";

/**
 * Pulls a tournament's latest results from CricHeroes and shows what changed.
 * Safe to press repeatedly — only new matches are fetched.
 */
export function CricheroesSyncButton({
  tournamentId,
  tournamentName,
  variant = "secondary",
  size = "sm",
  label = "Sync from CricHeroes",
  className,
}: {
  tournamentId: string;
  tournamentName?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  label?: string;
  className?: string;
}) {
  const [report, setReport] = useState<ImportReport | null>(null);

  const sync = useToastMutation({
    mutationFn: () => tournamentsApi.importCricheroes(tournamentId),
    successMessage: (data) =>
      data.matches.failed.length > 0
        ? `Imported ${data.matches.imported} of ${data.matches.found} — ${data.matches.failed.length} failed`
        : data.matches.imported > 0
          ? `Imported ${data.matches.imported} new match${data.matches.imported === 1 ? "" : "es"}`
          : "Already up to date with CricHeroes",
    invalidate: [
      queryKeys.matches,
      queryKeys.tournaments,
      queryKeys.tournament(tournamentId),
      queryKeys.tournamentStats(tournamentId),
      queryKeys.pointsTable(tournamentId),
      queryKeys.players,
      queryKeys.teams,
      queryKeys.dashboard,
    ],
    onSuccess: (data) => setReport(data),
  });

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => sync.mutate()}
        loading={sync.isPending}
        className={className}
        title={
          tournamentName
            ? `Pull the latest ${tournamentName} results from CricHeroes`
            : "Pull the latest results from CricHeroes"
        }
      >
        <RefreshCw className="size-4" aria-hidden />
        {sync.isPending ? "Syncing…" : label}
      </Button>

      <Modal
        open={report !== null}
        onClose={() => setReport(null)}
        title="Sync complete"
        description={
          report
            ? `${report.tournament.name} · CricHeroes tournament #${report.tournament.externalId}`
            : undefined
        }
        size="lg"
      >
        {report && <SyncReport report={report} />}
      </Modal>
    </>
  );
}

export function SyncReport({ report }: { report: ImportReport }) {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Matches found" value={report.matches.found} />
        <Stat label="Imported now" value={report.matches.imported} />
        <Stat
          label="Players linked"
          value={report.players.linkedById + report.players.matched.length}
        />
        <Stat label="Players created" value={report.players.created.length} />
      </dl>

      {report.matches.imported === 0 && report.matches.failed.length === 0 && (
        <p className="text-muted">
          Nothing new — every match on CricHeroes is already here.
        </p>
      )}

      {report.matches.failed.length > 0 && (
        <section>
          <h3 className="mb-1.5 font-medium text-ball">
            {report.matches.failed.length} match
            {report.matches.failed.length === 1 ? "" : "es"} failed
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
          <h3 className="mb-1.5 font-medium text-text">
            Names matched by rule — worth a glance
          </h3>
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
          <h3 className="mb-1.5 font-medium text-text">
            Duplicate CricHeroes profiles merged
          </h3>
          <p className="text-muted">
            {report.players.aliased.map((a) => a.name).join(", ")}
          </p>
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
                    <td className="py-1.5 pr-3 text-right text-muted">
                      {s.official.matches}/{s.derived.matches}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-muted">
                      {s.official.won}/{s.derived.wins}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-muted">
                      {s.official.points}/{s.derived.points}
                    </td>
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
