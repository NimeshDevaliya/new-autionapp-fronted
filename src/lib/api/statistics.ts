import { request } from "../api-client";
import type { DashboardStats, Leaderboards, SearchResults } from "@/types";

export const statisticsApi = {
  dashboard: () => request<DashboardStats>({ url: "/statistics/dashboard" }),

  leaderboards: (params: { tournament?: string; limit?: number } = {}) =>
    request<Leaderboards>({ url: "/statistics/leaderboards", params }),
};

export const searchApi = {
  global: (q: string, limit = 5) =>
    request<SearchResults>({ url: "/search", params: { q, limit } }),
};
