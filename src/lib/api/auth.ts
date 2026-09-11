import { request } from "../api-client";
import type { Admin } from "@/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: Pick<Admin, "_id" | "name" | "email" | "role" | "status"> & { id?: string };
}

export const authApi = {
  login: (input: LoginInput) =>
    request<LoginResponse>({ url: "/auth/login", method: "POST", data: input }),

  logout: () => request<null>({ url: "/auth/logout", method: "POST" }),

  me: () => request<Admin>({ url: "/auth/me" }),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<null>({ url: "/auth/change-password", method: "POST", data: input }),
};
