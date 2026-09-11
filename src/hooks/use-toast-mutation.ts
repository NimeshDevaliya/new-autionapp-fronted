"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApiRequestError } from "@/lib/api-client";

/**
 * Mutation wrapper that reports success/failure as a toast and invalidates the
 * query keys affected by the change — so every write has consistent feedback.
 */
export function useToastMutation<TData, TVariables>({
  mutationFn,
  successMessage,
  invalidate = [],
  onSuccess,
  ...options
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage: string | ((data: TData) => string);
  invalidate?: QueryKey[];
  onSuccess?: (data: TData, variables: TVariables) => void;
} & Omit<
  UseMutationOptions<TData, ApiRequestError, TVariables>,
  "mutationFn" | "onSuccess"
>) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiRequestError, TVariables>({
    mutationFn,
    onSuccess: async (data, variables) => {
      await Promise.all(
        invalidate.map((key) => queryClient.invalidateQueries({ queryKey: key }))
      );
      toast.success(
        typeof successMessage === "function" ? successMessage(data) : successMessage
      );
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      toast.error(error.message);
    },
    ...options,
  });
}
