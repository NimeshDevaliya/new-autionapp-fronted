import { request, requestList } from "../api-client";
import type {
  Auction,
  AuctionPlayer,
  AuctionResults,
  AuctionState,
  BidIncrementTier,
} from "@/types";

export interface AuctionInput {
  name?: string;
  tournament?: string;
  bidIncrementTiers?: BidIncrementTier[];
  maxSquadSize?: number;
  minSquadSize?: number;
  maxForeignPlayers?: number;
  timerSeconds?: number;
}

export const auctionsApi = {
  list: (params: { tournament?: string; status?: string } = {}) =>
    requestList<Auction>({ url: "/auctions", params }),

  get: (id: string) => request<Auction>({ url: `/auctions/${id}` }),

  state: (id: string) => request<AuctionState>({ url: `/auctions/${id}/state` }),

  players: (id: string, params: { status?: string } = {}) =>
    request<AuctionPlayer[]>({ url: `/auctions/${id}/players`, params }),

  results: (id: string, params: { team?: string; role?: string } = {}) =>
    request<AuctionResults>({ url: `/auctions/${id}/results`, params }),

  create: (data: AuctionInput) =>
    request<Auction>({ url: "/auctions", method: "POST", data }),

  update: (id: string, data: AuctionInput) =>
    request<Auction>({ url: `/auctions/${id}`, method: "PATCH", data }),

  remove: (id: string) => request<null>({ url: `/auctions/${id}`, method: "DELETE" }),

  addPlayers: (
    id: string,
    players: Array<{ player: string; basePrice?: number; order?: number }>
  ) =>
    request<{ added: number; skipped: number }>({
      url: `/auctions/${id}/players`,
      method: "POST",
      data: { players },
    }),

  removePlayer: (id: string, auctionPlayerId: string) =>
    request<null>({
      url: `/auctions/${id}/players/${auctionPlayerId}`,
      method: "DELETE",
    }),

  start: (id: string) => request<Auction>({ url: `/auctions/${id}/start`, method: "POST" }),
  pause: (id: string) => request<Auction>({ url: `/auctions/${id}/pause`, method: "POST" }),
  resume: (id: string) =>
    request<Auction>({ url: `/auctions/${id}/resume`, method: "POST" }),
  complete: (id: string) =>
    request<Auction>({ url: `/auctions/${id}/complete`, method: "POST" }),

  setCurrentPlayer: (id: string, auctionPlayerId?: string) =>
    request<{ auction: Auction; auctionPlayer: AuctionPlayer | null }>({
      url: `/auctions/${id}/current-player`,
      method: "POST",
      data: { auctionPlayerId },
    }),

  placeBid: (id: string, data: { teamId: string; amount?: number }) =>
    request<{ auctionPlayer: AuctionPlayer; nextBid: number }>({
      url: `/auctions/${id}/bids`,
      method: "POST",
      data,
    }),

  sell: (id: string) =>
    request<{ auctionPlayer: AuctionPlayer; soldPrice: number }>({
      url: `/auctions/${id}/sell`,
      method: "POST",
    }),

  markUnsold: (id: string) =>
    request<AuctionPlayer>({ url: `/auctions/${id}/unsold`, method: "POST" }),

  nextPlayer: (id: string) =>
    request<{ auction: Auction; auctionPlayer: AuctionPlayer | null }>({
      url: `/auctions/${id}/next-player`,
      method: "POST",
    }),
};
