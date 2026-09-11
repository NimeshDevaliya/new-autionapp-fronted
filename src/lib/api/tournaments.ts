import { request, requestList } from "../api-client";
import type {
  ImportReport,
  PointsTableRow,
  Tournament,
  TournamentStatistics,
} from "@/types";

export interface TournamentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  seriesName?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type TournamentInput = Partial<
  Pick<
    Tournament,
    | "name"
    | "shortName"
    | "seriesName"
    | "seasonName"
    | "seasonNumber"
    | "logo"
    | "location"
    | "status"
    | "description"
  >
> & { startDate?: string; endDate?: string };

export const tournamentsApi = {
  list: (params: TournamentListParams = {}) =>
    requestList<Tournament>({ url: "/tournaments", params }),

  get: (id: string) => request<Tournament>({ url: `/tournaments/${id}` }),

  statistics: (id: string) =>
    request<TournamentStatistics>({ url: `/tournaments/${id}/statistics` }),

  pointsTable: (id: string) =>
    request<PointsTableRow[]>({ url: `/tournaments/${id}/points-table` }),

  create: (data: TournamentInput) =>
    request<Tournament>({ url: "/tournaments", method: "POST", data }),

  update: (id: string, data: TournamentInput) =>
    request<Tournament>({ url: `/tournaments/${id}`, method: "PATCH", data }),

  remove: (id: string) =>
    request<null>({ url: `/tournaments/${id}`, method: "DELETE" }),

  start: (id: string) =>
    request<Tournament>({ url: `/tournaments/${id}/start`, method: "POST" }),

  end: (id: string) =>
    request<Tournament>({ url: `/tournaments/${id}/end`, method: "POST" }),

  /** Pulls matches, scorecards and standings from CricHeroes. Slow — one request per match. */
  importCricheroes: (
    id: string,
    data: { externalTournamentId?: number; refresh?: boolean } = {}
  ) =>
    request<ImportReport>({
      url: `/tournaments/${id}/import-cricheroes`,
      method: "POST",
      data,
      timeout: 5 * 60_000,
    }),

  seasons: () =>
    request<Array<{ seriesName: string; seasons: Tournament[] }>>({
      url: "/seasons",
    }),
};
