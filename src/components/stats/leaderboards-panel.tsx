"use client";

import { useState } from "react";
import { ChartBar } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/states";
import {
  AllRounderTable,
  BattingTable,
  BestBowlingTable,
  BowlingTable,
  FieldingTable,
  HighestScoresTable,
} from "./leaderboard-tables";
import type { Leaderboards, TournamentStatistics } from "@/types";

type Board = "batting" | "bowling" | "allrounders" | "fielding" | "performances";

/**
 * The top-10 boards behind one set of tabs. Best individual performances are
 * only available when scoped to a tournament, so that tab appears when given.
 */
export function LeaderboardsPanel({
  data,
  performances,
  scopeLabel,
}: {
  data: Leaderboards;
  performances?: Pick<TournamentStatistics, "highestScores" | "bestBowling">;
  scopeLabel: string;
}) {
  const [board, setBoard] = useState<Board>("batting");

  const nothing =
    data.topRunScorers.length === 0 &&
    data.topWicketTakers.length === 0 &&
    data.topFielders.length === 0;

  if (nothing) {
    return (
      <Panel>
        <EmptyState
          icon={ChartBar}
          title="No match data yet"
          message="Leaderboards fill in once matches have scorecards."
        />
      </Panel>
    );
  }

  const tabs = [
    { value: "batting", label: "Batting", count: data.topRunScorers.length },
    { value: "bowling", label: "Bowling", count: data.topWicketTakers.length },
    { value: "allrounders", label: "All-rounders", count: data.topAllRounders.length },
    { value: "fielding", label: "Fielding", count: data.topFielders.length },
    ...(performances
      ? [{ value: "performances", label: "Best performances" }]
      : []),
  ];

  const description: Record<Board, string> = {
    batting: `Most runs ${scopeLabel}.`,
    bowling: `Most wickets ${scopeLabel}.`,
    allrounders: `Bat and ball combined ${scopeLabel}.`,
    fielding: `Catches, stumpings and run outs ${scopeLabel}.`,
    performances: `The biggest single-match efforts ${scopeLabel}.`,
  };

  return (
    <Panel>
      <PanelHeader title="Top 10" description={description[board]} />
      <Tabs
        tabs={tabs}
        value={board}
        onChange={(value) => setBoard(value as Board)}
        className="px-3"
      />
      {board === "batting" && <BattingTable rows={data.topRunScorers} />}
      {board === "bowling" && <BowlingTable rows={data.topWicketTakers} />}
      {board === "allrounders" && (
        <AllRounderTable
          rows={data.topAllRounders}
          wicketWeight={data.allRounderWicketWeight}
        />
      )}
      {board === "fielding" && <FieldingTable rows={data.topFielders} />}
      {board === "performances" && performances && (
        <div className="divide-y divide-line">
          <section>
            <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-muted">
              Highest individual scores
            </h3>
            <HighestScoresTable rows={performances.highestScores} />
          </section>
          <section>
            <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-muted">
              Best bowling figures
            </h3>
            <BestBowlingTable rows={performances.bestBowling} />
          </section>
        </div>
      )}
    </Panel>
  );
}
