import { request } from "../api-client";
import type { TeamOwner } from "@/types";

export interface TeamOwnerInput {
  name: string;
  email: string;
  password: string;
}

export const teamOwnersApi = {
  list: (teamId: string) => request<TeamOwner[]>({ url: `/teams/${teamId}/owners` }),
  create: (teamId: string, data: TeamOwnerInput) =>
    request<TeamOwner>({ url: `/teams/${teamId}/owners`, method: "POST", data }),
  update: (
    teamId: string,
    ownerId: string,
    data: { name?: string; status?: "ACTIVE" | "INACTIVE"; password?: string }
  ) =>
    request<TeamOwner>({ url: `/teams/${teamId}/owners/${ownerId}`, method: "PATCH", data }),
  remove: (teamId: string, ownerId: string) =>
    request<null>({ url: `/teams/${teamId}/owners/${ownerId}`, method: "DELETE" }),
};
