import { request, requestList } from "../api-client";
import type { Team, TeamSquadEntry } from "@/types";

export interface TeamListParams {
  page?: number;
  limit?: number;
  search?: string;
  tournament?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type TeamInput = Partial<
  Pick<
    Team,
    | "name"
    | "shortName"
    | "logo"
    | "ownerName"
    | "color"
    | "budget"
    | "maxPlayers"
    | "minPlayers"
    | "maxForeignPlayers"
    | "status"
  >
> & { tournament?: string };

export const teamsApi = {
  list: (params: TeamListParams = {}) => requestList<Team>({ url: "/teams", params }),

  get: (id: string) => request<Team>({ url: `/teams/${id}` }),

  squad: (id: string) => request<TeamSquadEntry[]>({ url: `/teams/${id}/squad` }),

  create: (data: TeamInput) => request<Team>({ url: "/teams", method: "POST", data }),

  update: (id: string, data: TeamInput) =>
    request<Team>({ url: `/teams/${id}`, method: "PATCH", data }),

  remove: (id: string) => request<null>({ url: `/teams/${id}`, method: "DELETE" }),
};
