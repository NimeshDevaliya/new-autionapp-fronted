import { request, requestList } from "../api-client";
import type { Match } from "@/types";

export interface MatchListParams {
  page?: number;
  limit?: number;
  tournament?: string;
  team?: string;
  status?: string;
}

export const matchesApi = {
  list: (params: MatchListParams = {}) => requestList<Match>({ url: "/matches", params }),

  get: (id: string) => request<Match>({ url: `/matches/${id}` }),

  create: (data: Record<string, unknown>) =>
    request<Match>({ url: "/matches", method: "POST", data }),

  update: (id: string, data: Record<string, unknown>) =>
    request<Match>({ url: `/matches/${id}`, method: "PATCH", data }),

  remove: (id: string) => request<null>({ url: `/matches/${id}`, method: "DELETE" }),
};
