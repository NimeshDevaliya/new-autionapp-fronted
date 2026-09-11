"use client";

import Link from "next/link";
import { TeamCrest } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PointsTableRow } from "@/types";

const FORM_TONE: Record<PointsTableRow["form"][number], string> = {
  W: "bg-pitch/20 text-pitch",
  L: "bg-ball/20 text-ball",
  T: "bg-amber/20 text-amber",
  N: "bg-surface-3 text-muted",
};

/** League standings with net run rate and recent form. */
export function PointsTable({
  rows,
  emptyState,
}: {
  rows: PointsTableRow[];
  emptyState: React.ReactNode;
}) {
  const hasAdjustments = rows.some((r) => r.pointsAdjustment !== 0);

  const columns: Column<PointsTableRow>[] = [
    {
      key: "position",
      header: "#",
      className: "w-10",
      render: (_row, index) => <span className="tabular text-faint">{index + 1}</span>,
    },
    {
      key: "team",
      header: "Team",
      render: (row) => (
        <Link
          href={`/teams/${row.team._id}`}
          className="flex min-w-0 items-center gap-2.5 transition-colors hover:text-amber"
        >
          <TeamCrest name={row.team.name} src={row.team.logo} color={row.team.color} size="sm" />
          <span className="truncate font-medium text-text">{row.team.name}</span>
        </Link>
      ),
    },
    { key: "matches", header: "P", numeric: true, render: (row) => row.matches },
    {
      key: "wins",
      header: "W",
      numeric: true,
      render: (row) => <span className="text-pitch">{row.wins}</span>,
    },
    { key: "losses", header: "L", numeric: true, render: (row) => row.losses },
    { key: "ties", header: "T", numeric: true, render: (row) => row.ties },
    { key: "nr", header: "NR", numeric: true, render: (row) => row.noResults },
    {
      key: "points",
      header: "Pts",
      numeric: true,
      render: (row) => (
        <span className="display text-base text-amber">
          {row.points}
          {row.pointsAdjustment !== 0 && (
            <span
              className="ml-1 align-super text-[10px] text-faint"
              title={`Includes ${row.pointsAdjustment > 0 ? "+" : ""}${row.pointsAdjustment} awarded by the league`}
            >
              {row.pointsAdjustment > 0 ? "+" : ""}
              {row.pointsAdjustment}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "nrr",
      header: "NRR",
      numeric: true,
      render: (row) =>
        row.netRunRate === null ? (
          <span className="text-faint">—</span>
        ) : (
          <span className={cn(row.netRunRate >= 0 ? "text-pitch" : "text-ball")}>
            {row.netRunRate > 0 ? "+" : ""}
            {row.netRunRate.toFixed(3)}
          </span>
        ),
    },
    {
      key: "form",
      header: "Form",
      render: (row) =>
        row.form.length ? (
          <span className="flex gap-1" aria-label={`Last ${row.form.length}: ${row.form.join(" ")}`}>
            {row.form.map((result, index) => (
              <span
                key={index}
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded text-[11px] font-semibold",
                  FORM_TONE[result]
                )}
              >
                {result}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
  ];

  return (
    <div>
      <DataTable columns={columns} rows={rows} keyOf={(row) => row.team._id} emptyState={emptyState} />
      {rows.length > 0 && (
        <p className="border-t border-line px-4 py-2.5 text-xs text-faint">
          Two points for a win, one for a tie. Net run rate charges a side bowled out with its
          full quota of overs.
          {hasAdjustments && " Superscript figures are points the league awarded separately."}
        </p>
      )}
    </div>
  );
}
