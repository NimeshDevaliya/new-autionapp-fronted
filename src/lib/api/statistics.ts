import { request } from "../api-client";
import type { DashboardStats, LeaderboardEntry, SearchResults } from "@/types";

export const statisticsApi = {
  dashboard: () => request<DashboardStats>({ url: "/statistics/dashboard" }),

  leaderboards: (params: { tournament?: string; limit?: number } = {}) =>
    request<{
      topRunScorers: LeaderboardEntry[];
      topWicketTakers: LeaderboardEntry[];
    }>({ url: "/statistics/leaderboards", params }),
};

export const searchApi = {
  global: (q: string, limit = 5) =>
    request<SearchResults>({ url: "/search", params: { q, limit } }),
};
