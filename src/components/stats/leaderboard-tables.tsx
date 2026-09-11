"use client";

import Link from "next/link";
import { ChartBar } from "lucide-react";
import { PlayerAvatar, TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { formatDate } from "@/lib/utils";
import type {
  AllRounderLeaderboardEntry,
  BattingLeaderboardEntry,
  BestBowlingEntry,
  BowlingLeaderboardEntry,
  FieldingLeaderboardEntry,
  HighestScoreEntry,
} from "@/types";

/* ------------------------------------------------------------- helpers --- */

/** Overs read as cricket notation: 8 → "8", 7.4 → "7.4". */
export function formatOvers(overs: number | null | undefined): string {
  if (overs === null || overs === undefined) return "—";
  return Number.isInteger(overs) ? String(overs) : overs.toFixed(1);
}

function num(value: number | null | undefined, places = 0): string {
  if (value === null || value === undefined) return "—";
  return places ? value.toFixed(places) : value.toLocaleString("en-IN");
}

function PlayerCell({
  rank,
  player,
  team,
}: {
  rank?: number;
  player: BattingLeaderboardEntry["player"];
  team: BattingLeaderboardEntry["team"];
}) {
  const name = player?.fullName ?? "Unknown player";
  const inner = (
    <span className="flex min-w-0 items-center gap-3">
      {rank !== undefined && (
        <span className="w-5 shrink-0 text-right text-xs text-faint tabular">{rank}</span>
      )}
      <PlayerAvatar name={name} src={player?.profileImage} size="sm" />
      <span className="min-w-0">
        <span className="block truncate font-medium text-text">{name}</span>
        {team && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="size-2 rounded-sm"
              style={{ backgroundColor: team.color ?? "#24314c" }}
              aria-hidden
            />
            <span className="truncate">{team.shortName || team.name}</span>
          </span>
        )}
      </span>
    </span>
  );
  return player ? (
    <Link href={`/players/${player._id}`} className="block transition-colors hover:text-amber">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function TeamCell({ team }: { team: HighestScoreEntry["team"] }) {
  if (!team) return <span className="text-faint">—</span>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <TeamCrest name={team.name} src={team.logo} color={team.color} size="sm" />
      <span className="truncate text-muted">{team.shortName || team.name}</span>
    </span>
  );
}

const Headline = ({ children }: { children: React.ReactNode }) => (
  <span className="display text-base text-amber">{children}</span>
);

function empty(title: string, message: string) {
  return <EmptyState icon={ChartBar} title={title} message={message} className="py-10" />;
}

/* -------------------------------------------------------------- tables --- */

export function BattingTable({ rows }: { rows: BattingLeaderboardEntry[] }) {
  const columns: Column<BattingLeaderboardEntry>[] = [
    { key: "player", header: "Player", render: (r, i) => <PlayerCell rank={i + 1} player={r.player} team={r.team} /> },
    { key: "matches", header: "M", numeric: true, render: (r) => num(r.matches) },
    { key: "innings", header: "Inns", numeric: true, render: (r) => num(r.innings) },
    { key: "runs", header: "Runs", numeric: true, render: (r) => <Headline>{num(r.runs)}</Headline> },
    { key: "hs", header: "HS", numeric: true, render: (r) => num(r.highestScore) },
    { key: "avg", header: "Avg", numeric: true, render: (r) => num(r.average, 2) },
    { key: "sr", header: "SR", numeric: true, render: (r) => num(r.strikeRate, 2) },
    { key: "fours", header: "4s", numeric: true, render: (r) => num(r.fours) },
    { key: "sixes", header: "6s", numeric: true, render: (r) => num(r.sixes) },
    { key: "fifties", header: "50s", numeric: true, render: (r) => num(r.fifties) },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyOf={(r) => r._id}
      emptyState={empty("No batting yet", "Runs appear once scorecards are recorded.")}
    />
  );
}

export function BowlingTable({ rows }: { rows: BowlingLeaderboardEntry[] }) {
  const columns: Column<BowlingLeaderboardEntry>[] = [
    { key: "player", header: "Player", render: (r, i) => <PlayerCell rank={i + 1} player={r.player} team={r.team} /> },
    { key: "matches", header: "M", numeric: true, render: (r) => num(r.matches) },
    { key: "innings", header: "Inns", numeric: true, render: (r) => num(r.innings) },
    { key: "overs", header: "Overs", numeric: true, render: (r) => formatOvers(r.overs) },
    { key: "wickets", header: "Wkts", numeric: true, render: (r) => <Headline>{num(r.wickets)}</Headline> },
    { key: "runs", header: "Runs", numeric: true, render: (r) => num(r.runsConceded) },
    { key: "econ", header: "Econ", numeric: true, render: (r) => num(r.economy, 2) },
    { key: "avg", header: "Avg", numeric: true, render: (r) => num(r.average, 2) },
    { key: "best", header: "Best", numeric: true, render: (r) => r.bestBowling },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyOf={(r) => r._id}
      emptyState={empty("No bowling yet", "Wickets appear once scorecards are recorded.")}
    />
  );
}

export function AllRounderTable({
  rows,
  wicketWeight,
}: {
  rows: AllRounderLeaderboardEntry[];
  wicketWeight: number;
}) {
  const columns: Column<AllRounderLeaderboardEntry>[] = [
    { key: "player", header: "Player", render: (r, i) => <PlayerCell rank={i + 1} player={r.player} team={r.team} /> },
    { key: "matches", header: "M", numeric: true, render: (r) => num(r.matches) },
    { key: "runs", header: "Runs", numeric: true, render: (r) => num(r.runs) },
    { key: "sr", header: "SR", numeric: true, render: (r) => num(r.strikeRate, 2) },
    { key: "wickets", header: "Wkts", numeric: true, render: (r) => num(r.wickets) },
    { key: "econ", header: "Econ", numeric: true, render: (r) => num(r.economy, 2) },
    { key: "points", header: "Points", numeric: true, render: (r) => <Headline>{num(r.points)}</Headline> },
  ];
  return (
    <div>
      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(r) => r._id}
        emptyState={empty(
          "No all-rounders yet",
          "Players who have both batted and bowled will be ranked here."
        )}
      />
      {rows.length > 0 && (
        <p className="border-t border-line px-4 py-2.5 text-xs text-faint">
          Points are runs scored plus {wicketWeight} for every wicket taken. Only players
          who have both batted and bowled are ranked.
        </p>
      )}
    </div>
  );
}

export function FieldingTable({ rows }: { rows: FieldingLeaderboardEntry[] }) {
  const columns: Column<FieldingLeaderboardEntry>[] = [
    { key: "player", header: "Player", render: (r, i) => <PlayerCell rank={i + 1} player={r.player} team={r.team} /> },
    { key: "catches", header: "Catches", numeric: true, render: (r) => num(r.catches) },
    { key: "stumpings", header: "Stumpings", numeric: true, render: (r) => num(r.stumpings) },
    { key: "runouts", header: "Run outs", numeric: true, render: (r) => num(r.runOuts) },
    { key: "total", header: "Dismissals", numeric: true, render: (r) => <Headline>{num(r.dismissals)}</Headline> },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyOf={(r) => r._id}
      emptyState={empty("No fielding yet", "Catches and run outs come from scorecards.")}
    />
  );
}

export function HighestScoresTable({ rows }: { rows: HighestScoreEntry[] }) {
  const columns: Column<HighestScoreEntry>[] = [
    { key: "player", header: "Player", render: (r) => <PlayerCell player={r.player} team={null} /> },
    { key: "team", header: "Team", render: (r) => <TeamCell team={r.team} /> },
    {
      key: "runs",
      header: "Runs",
      numeric: true,
      render: (r) => (
        <Headline>
          {num(r.runs)}
          {!r.isOut && "*"}
        </Headline>
      ),
    },
    { key: "balls", header: "Balls", numeric: true, render: (r) => num(r.balls) },
    { key: "fours", header: "4s", numeric: true, render: (r) => num(r.fours) },
    { key: "sixes", header: "6s", numeric: true, render: (r) => num(r.sixes) },
    {
      key: "sr",
      header: "SR",
      numeric: true,
      render: (r) => (r.balls > 0 ? ((r.runs / r.balls) * 100).toFixed(2) : "—"),
    },
    {
      key: "date",
      header: "Date",
      render: (r) =>
        r.match ? (
          <Link href={`/matches/${r.match._id}`} className="text-sky hover:underline tabular">
            {formatDate(r.match.matchDate)}
          </Link>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyOf={(r) => r._id}
      emptyState={empty("No innings yet", "Individual scores appear once matches are scored.")}
    />
  );
}

export function BestBowlingTable({ rows }: { rows: BestBowlingEntry[] }) {
  const columns: Column<BestBowlingEntry>[] = [
    { key: "player", header: "Player", render: (r) => <PlayerCell player={r.player} team={null} /> },
    { key: "team", header: "Team", render: (r) => <TeamCell team={r.team} /> },
    {
      key: "figures",
      header: "Figures",
      numeric: true,
      render: (r) => (
        <Headline>
          {r.wickets}/{r.runsConceded}
        </Headline>
      ),
    },
    { key: "overs", header: "Overs", numeric: true, render: (r) => formatOvers(r.overs) },
    { key: "maidens", header: "Mdns", numeric: true, render: (r) => num(r.maidens) },
    {
      key: "econ",
      header: "Econ",
      numeric: true,
      render: (r) => {
        const whole = Math.floor(r.overs);
        const balls = whole * 6 + Math.round((r.overs - whole) * 10);
        return balls > 0 ? (r.runsConceded / (balls / 6)).toFixed(2) : "—";
      },
    },
    {
      key: "date",
      header: "Date",
      render: (r) =>
        r.match ? (
          <Link href={`/matches/${r.match._id}`} className="text-sky hover:underline tabular">
            {formatDate(r.match.matchDate)}
          </Link>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyOf={(r) => r._id}
      emptyState={empty("No spells yet", "Best bowling figures appear once matches are scored.")}
    />
  );
}
