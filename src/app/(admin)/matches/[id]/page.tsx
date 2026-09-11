"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Trophy } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { PlayerAvatar, TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { formatOvers } from "@/components/stats/leaderboard-tables";
import { matchesApi } from "@/lib/api/matches";
import { queryKeys } from "@/lib/query-keys";
import { cn, formatDate } from "@/lib/utils";
import type {
  MatchDetail,
  ScorecardBatting,
  ScorecardBowling,
  ScorecardInnings,
  Team,
} from "@/types";

/** Reads the dismissal back in scorecard shorthand — "c Kunal Gajjar b Akash Patel". */
function dismissalText(row: ScorecardBatting): string {
  const bowler = row.dismissalBowler?.fullName;
  const fielder = row.dismissalFielder?.fullName;
  switch (row.dismissalType) {
    case "NOT_OUT":
      return "not out";
    case "BOWLED":
      return bowler ? `b ${bowler}` : "bowled";
    case "CAUGHT":
      if (fielder && bowler && fielder === bowler) return `c & b ${bowler}`;
      return `c ${fielder ?? "?"}${bowler ? ` b ${bowler}` : ""}`;
    case "LBW":
      return bowler ? `lbw b ${bowler}` : "lbw";
    case "STUMPED":
      return `st ${fielder ?? "?"}${bowler ? ` b ${bowler}` : ""}`;
    case "RUN_OUT":
      return fielder ? `run out (${fielder})` : "run out";
    case "HIT_WICKET":
      return bowler ? `hit wicket b ${bowler}` : "hit wicket";
    case "RETIRED_HURT":
      return "retired hurt";
    default:
      return "out";
  }
}

function strikeRate(runs: number, balls: number): string {
  return balls > 0 ? ((runs / balls) * 100).toFixed(2) : "—";
}

function economy(runsConceded: number, overs: number): string {
  const whole = Math.floor(overs);
  const balls = whole * 6 + Math.round((overs - whole) * 10);
  return balls > 0 ? (runsConceded / (balls / 6)).toFixed(2) : "—";
}

const BATTING_COLUMNS: Column<ScorecardBatting>[] = [
  {
    key: "batter",
    header: "Batter",
    className: "min-w-[220px]",
    render: (row) => (
      <Link
        href={`/players/${row.player._id}`}
        className="flex min-w-0 items-center gap-3 transition-colors hover:text-amber"
      >
        <PlayerAvatar name={row.player.fullName} src={row.player.profileImage} size="sm" />
        <span className="min-w-0">
          <span className={cn("block truncate", row.isOut ? "text-text" : "font-medium text-text")}>
            {row.player.fullName}
          </span>
          <span className="block truncate text-xs text-muted">{dismissalText(row)}</span>
        </span>
      </Link>
    ),
  },
  {
    key: "runs",
    header: "R",
    numeric: true,
    render: (row) => (
      <span className="display text-base text-text">
        {row.runs}
        {!row.isOut && row.dismissalType === "NOT_OUT" && (
          <span className="text-amber">*</span>
        )}
      </span>
    ),
  },
  { key: "balls", header: "B", numeric: true, render: (row) => row.balls },
  { key: "fours", header: "4s", numeric: true, render: (row) => row.fours },
  { key: "sixes", header: "6s", numeric: true, render: (row) => row.sixes },
  { key: "sr", header: "SR", numeric: true, render: (row) => strikeRate(row.runs, row.balls) },
];

const BOWLING_COLUMNS: Column<ScorecardBowling>[] = [
  {
    key: "bowler",
    header: "Bowler",
    className: "min-w-[200px]",
    render: (row) => (
      <Link
        href={`/players/${row.player._id}`}
        className="flex min-w-0 items-center gap-3 transition-colors hover:text-amber"
      >
        <PlayerAvatar name={row.player.fullName} src={row.player.profileImage} size="sm" />
        <span className="truncate text-text">{row.player.fullName}</span>
      </Link>
    ),
  },
  { key: "overs", header: "O", numeric: true, render: (row) => formatOvers(row.overs) },
  { key: "maidens", header: "M", numeric: true, render: (row) => row.maidens },
  { key: "runs", header: "R", numeric: true, render: (row) => row.runsConceded },
  {
    key: "wickets",
    header: "W",
    numeric: true,
    render: (row) => <span className="display text-base text-amber">{row.wickets}</span>,
  },
  { key: "econ", header: "Econ", numeric: true, render: (row) => economy(row.runsConceded, row.overs) },
];

function InningsPanel({ innings, team, bowlingTeam }: { innings: ScorecardInnings; team: Team | undefined; bowlingTeam: Team | undefined }) {
  const total = innings.innings;
  return (
    <Panel>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <span className="flex items-center gap-3">
          {team && <TeamCrest name={team.name} src={team.logo} color={team.color} size="md" />}
          <span>
            <span className="display block text-xl leading-tight text-text">
              {team?.name ?? "Batting side"}
            </span>
            <span className="text-xs text-muted">
              {total.inningsNumber === 1 ? "First innings" : "Second innings"}
              {bowlingTeam ? ` against ${bowlingTeam.shortName || bowlingTeam.name}` : ""}
            </span>
          </span>
        </span>
        <span className="text-right">
          <span className="display block text-3xl leading-none text-amber tabular">
            {total.totalRuns}/{total.totalWickets}
          </span>
          <span className="text-xs text-muted tabular">
            {formatOvers(total.totalOvers)} overs{total.allOut ? ", all out" : ""}
          </span>
        </span>
      </header>

      <DataTable
        columns={BATTING_COLUMNS}
        rows={innings.batting}
        keyOf={(row) => row._id}
        emptyState={<EmptyState title="No batting recorded" className="py-8" />}
      />
      <p className="flex justify-between border-t border-line px-4 py-2.5 text-sm text-muted tabular">
        <span>Extras {total.extras}</span>
        <span>
          Total{" "}
          <span className="font-semibold text-text">
            {total.totalRuns}/{total.totalWickets}
          </span>{" "}
          in {formatOvers(total.totalOvers)} overs
        </span>
      </p>

      <div className="border-t border-line">
        <DataTable
          columns={BOWLING_COLUMNS}
          rows={innings.bowling}
          keyOf={(row) => row._id}
          emptyState={<EmptyState title="No bowling recorded" className="py-8" />}
        />
      </div>
    </Panel>
  );
}

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const match = useQuery({
    queryKey: queryKeys.match(id),
    queryFn: () => matchesApi.get(id),
  });

  if (match.isLoading) return <LoadingState label="Loading scorecard" />;
  if (match.isError) {
    return (
      <ErrorState
        title="Couldn't load this match"
        message={match.error.message}
        onRetry={() => match.refetch()}
      />
    );
  }

  const data: MatchDetail | undefined = match.data;
  if (!data) return null;

  const tournament = typeof data.tournament === "object" ? data.tournament : null;
  const teams = new Map<string, Team>([
    [data.teamA._id, data.teamA],
    [data.teamB._id, data.teamB],
  ]);
  const scorecard = [...data.scorecard].sort(
    (a, b) => a.innings.inningsNumber - b.innings.inningsNumber
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={tournament ? `/tournaments/${tournament._id}` : "/tournaments"}
            className="mt-1 text-muted transition-colors hover:text-text"
            aria-label="Back to tournament"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="display text-2xl leading-tight sm:text-3xl">
              {data.teamA.name} <span className="text-faint">v</span> {data.teamB.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {tournament && <span>{tournament.name}</span>}
              {data.matchNumber && <span className="tabular">Match {data.matchNumber}</span>}
              <span className="tabular">{formatDate(data.matchDate)}</span>
              {data.venue && <span>{data.venue}</span>}
              <StatusBadge status={data.status} />
            </div>
          </div>
        </div>
      </div>

      <Panel className="mb-5">
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
          <div>
            <p className="display text-2xl leading-tight text-text">
              {data.result || (data.winner ? `${data.winner.name} won` : "Result pending")}
            </p>
            {data.tossWonBy && (
              <p className="mt-1 text-sm text-muted">
                {data.tossWonBy.name} won the toss
                {data.tossDecision ? ` and chose to ${data.tossDecision === "BAT" ? "bat" : "bowl"}` : ""}.
              </p>
            )}
          </div>
          {data.playerOfTheMatch && (
            <Link
              href={`/players/${data.playerOfTheMatch._id}`}
              className="flex items-center gap-3 rounded-lg border border-amber/35 bg-amber/10 px-4 py-3 transition-colors hover:bg-amber/15"
            >
              <Trophy className="size-5 shrink-0 text-amber" aria-hidden />
              <span className="min-w-0">
                <span className="block text-xs text-amber">Player of the match</span>
                <span className="block truncate font-medium text-text">
                  {data.playerOfTheMatch.fullName}
                </span>
              </span>
            </Link>
          )}
        </div>
      </Panel>

      {scorecard.length === 0 ? (
        <Panel>
          <EmptyState
            title="No scorecard yet"
            message="Innings appear here once the match has been scored."
          />
        </Panel>
      ) : (
        <div className="flex flex-col gap-5">
          {scorecard.map((inn) => (
            <InningsPanel
              key={inn.innings._id}
              innings={inn}
              team={teams.get(inn.innings.battingTeam)}
              bowlingTeam={teams.get(inn.innings.bowlingTeam)}
            />
          ))}
        </div>
      )}
    </>
  );
}
