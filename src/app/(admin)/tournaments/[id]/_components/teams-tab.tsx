"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { TeamCrest } from "@/components/ui/avatar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { teamsApi } from "@/lib/api/teams";
import { queryKeys } from "@/lib/query-keys";
import { formatMoney } from "@/lib/utils";
import type { Team } from "@/types";

function PurseBar({ team }: { team: Team }) {
  const spentShare =
    team.budget > 0 ? Math.min(100, Math.round((team.spent / team.budget) * 100)) : 0;

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
      role="img"
      aria-label={`${spentShare}% of the purse spent`}
    >
      <div className="h-full rounded-full bg-amber" style={{ width: `${spentShare}%` }} />
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team._id}`}
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <div className="flex items-start gap-3">
        <TeamCrest name={team.name} src={team.logo} color={team.color} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{team.name}</p>
          <p className="mt-0.5 truncate text-sm text-muted">
            {team.ownerName ? `Owner: ${team.ownerName}` : "No owner on file"}
          </p>
        </div>
        <StatusBadge status={team.status} />
      </div>

      <PurseBar team={team} />

      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted">Budget</dt>
          <dd className="mt-0.5 tabular text-text">{formatMoney(team.budget)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Remaining</dt>
          <dd className="mt-0.5 tabular text-amber">
            {formatMoney(team.remainingBudget)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Players</dt>
          <dd className="mt-0.5 tabular text-text">
            {team.playersBought ?? 0}
            <span className="text-faint"> / {team.maxPlayers}</span>
          </dd>
        </div>
      </dl>
    </Link>
  );
}

export function TeamsTab({ tournamentId }: { tournamentId: string }) {
  const params = { tournament: tournamentId, limit: 100 };

  const teams = useQuery({
    queryKey: queryKeys.teamList(params),
    queryFn: () => teamsApi.list(params),
  });

  if (teams.isLoading) return <LoadingState label="Loading teams" />;
  if (teams.isError) {
    return (
      <Panel>
        <ErrorState message={teams.error.message} onRetry={() => teams.refetch()} />
      </Panel>
    );
  }

  const items = teams.data?.items ?? [];

  if (items.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={Users}
          title="No teams yet"
          message="Add teams to this tournament before running an auction."
        />
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((team) => (
        <TeamCard key={team._id} team={team} />
      ))}
    </div>
  );
}
