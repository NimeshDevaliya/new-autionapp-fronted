import { request, requestList } from "../api-client";
import type { Player, PlayerStatsResponse } from "@/types";

export interface PlayerListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  category?: string;
  tournament?: string;
  team?: string;
  auction?: string;
  auctionStatus?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type PlayerInput = Partial<
  Pick<
    Player,
    | "fullName"
    | "profileImage"
    | "battingStyle"
    | "bowlingStyle"
    | "role"
    | "category"
    | "basePrice"
    | "isActive"
    | "externalProfileUrl"
  >
> & { dateOfBirth?: string };

export const playersApi = {
  list: (params: PlayerListParams = {}) =>
    requestList<Player>({ url: "/players", params }),

  get: (id: string) => request<Player>({ url: `/players/${id}` }),

  statistics: (id: string, params: { tournament?: string; seriesName?: string } = {}) =>
    request<PlayerStatsResponse>({ url: `/players/${id}/statistics`, params }),

  create: (data: PlayerInput) =>
    request<Player>({ url: "/players", method: "POST", data }),

  update: (id: string, data: PlayerInput) =>
    request<Player>({ url: `/players/${id}`, method: "PATCH", data }),

  remove: (id: string) => request<null>({ url: `/players/${id}`, method: "DELETE" }),
};
