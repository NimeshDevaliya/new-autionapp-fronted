import { request, requestList } from "../api-client";
import type { Admin, AdminRole, AdminStatus } from "@/types";

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminRole;
  status?: AdminStatus;
}

export interface AdminInput {
  name?: string;
  email?: string;
  password?: string;
  role?: AdminRole;
  status?: AdminStatus;
}

export const adminsApi = {
  list: (params: AdminListParams = {}) => requestList<Admin>({ url: "/admins", params }),

  get: (id: string) => request<Admin>({ url: `/admins/${id}` }),

  create: (data: AdminInput) => request<Admin>({ url: "/admins", method: "POST", data }),

  update: (id: string, data: AdminInput) =>
    request<Admin>({ url: `/admins/${id}`, method: "PATCH", data }),

  resetPassword: (id: string, newPassword: string) =>
    request<null>({
      url: `/admins/${id}/reset-password`,
      method: "POST",
      data: { newPassword },
    }),

  remove: (id: string) => request<null>({ url: `/admins/${id}`, method: "DELETE" }),
};
