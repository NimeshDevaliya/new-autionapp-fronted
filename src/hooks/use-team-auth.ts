"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { teamAuthApi } from "@/lib/api/team-auth";
import { clearTeamToken, getTeamToken, setTeamToken } from "@/lib/team-auth";
import { queryKeys } from "@/lib/query-keys";
import type { ApiRequestError } from "@/lib/api-client";

/** The signed-in owner, their team and the auction to follow. Null when signed out. */
export function useTeamSession() {
  return useQuery({
    queryKey: queryKeys.teamMe(),
    queryFn: teamAuthApi.me,
    retry: false,
    staleTime: 15_000,
    // keep looking for an auction while there is none to subscribe to
    refetchInterval: (query) => (query.state.data?.auction ? false : 15_000),
    enabled: typeof window !== "undefined" && !!getTeamToken(),
  });
}

export function useTeamLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamAuthApi.login,
    onSuccess: async (data) => {
      setTeamToken(data.token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamSession });
      toast.success(`Welcome, ${data.team.name}`);
      router.replace("/team");
    },
    onError: (error: ApiRequestError) => toast.error(error.message),
  });
}

export function useTeamLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return () => {
    clearTeamToken();
    queryClient.removeQueries({ queryKey: queryKeys.teamSession });
    router.replace("/team/login");
  };
}
