"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, type LoginInput } from "@/lib/api/auth";
import { clearToken, getToken, setToken } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ApiRequestError } from "@/lib/api-client";

/** Current session. Returns null (not an error) when signed out. */
export function useCurrentAdmin() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60_000,
    // only attempt when a token exists, so signed-out visitors don't 401 on load
    enabled: typeof window !== "undefined" && !!getToken(),
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: async (data) => {
      setToken(data.token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth });
      toast.success(`Welcome back, ${data.admin.name}`);
      router.replace("/dashboard");
    },
    onError: (error: ApiRequestError) => {
      toast.error(error.message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    // the token is discarded either way — a failed call must not trap the user
    onSettled: () => {
      clearToken();
      queryClient.clear();
      toast.success("Signed out");
      router.replace("/login");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => toast.success("Password changed"),
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}
