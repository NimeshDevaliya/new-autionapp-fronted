"use client";

import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Right-align numeric columns so figures line up. */
  numeric?: boolean;
  className?: string;
  render: (row: T, index: number) => React.ReactNode;
}

/**
 * Dense data table with a sticky header. Scrolls horizontally on narrow
 * screens rather than crushing columns.
 */
export function DataTable<T>({
  columns,
  rows,
  keyOf,
  onRowClick,
  emptyState,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
}) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-surface-2">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "border-b border-line-strong px-4 py-3 text-left font-semibold text-muted",
                  column.numeric && "text-right",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={keyOf(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-line last:border-0",
                index % 2 === 1 && "bg-surface/40",
                onRowClick && "cursor-pointer transition-colors hover:bg-surface-2"
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-4 py-3 align-middle text-text",
                    column.numeric && "text-right tabular",
                    column.className
                  )}
                >
                  {column.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3"
      aria-label="Pagination"
    >
      <p className="text-sm text-muted tabular">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-line-strong px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-line-strong px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
