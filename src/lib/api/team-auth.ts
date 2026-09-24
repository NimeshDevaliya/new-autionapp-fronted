import { teamRequest } from "../team-auth";
import type { AuctionState, TeamOwnerMe, TeamOwnerSession, TeamSquadEntry } from "@/types";

export const teamAuthApi = {
  login: (input: { email: string; password: string }) =>
    teamRequest<TeamOwnerSession>({ url: "/team-auth/login", method: "POST", data: input }),
  me: () => teamRequest<TeamOwnerMe>({ url: "/team-auth/me" }),
  // public reads, sent with the owner token so a 401 never clears the admin session
  squad: (teamId: string) => teamRequest<TeamSquadEntry[]>({ url: `/teams/${teamId}/squad` }),
  auctionState: (auctionId: string) =>
    teamRequest<AuctionState>({ url: `/auctions/${auctionId}/state` }),
};
