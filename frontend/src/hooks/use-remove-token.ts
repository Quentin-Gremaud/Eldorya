"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createTokensApi } from "@/lib/api/tokens-api";
import type { Token } from "@/types/api";
import { toast } from "sonner";

interface RemoveTokenInput {
  tokenId: string;
  mapLevelId: string;
}

export function useRemoveToken(campaignId: string) {
  const apiFetch = useApiClient();
  const api = createTokensApi(apiFetch);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveTokenInput) =>
      api.removeToken(campaignId, input.tokenId, {
        commandId: crypto.randomUUID(),
      }),

    onMutate: async (input) => {
      const queryKey = ["tokens", campaignId, input.mapLevelId];

      await queryClient.cancelQueries({ queryKey, exact: true });

      const previousTokens = queryClient.getQueryData<Token[]>(queryKey);

      queryClient.setQueryData<Token[]>(queryKey, (old) =>
        (old ?? []).filter((token) => token.id !== input.tokenId)
      );

      return { previousTokens, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTokens) {
        queryClient.setQueryData(context.queryKey, context.previousTokens);
      }
      toast.error("Failed to remove token");
    },

    onSuccess: () => {
      toast.success("Token removed");
    },

    onSettled: (_data, _error, input) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["tokens", campaignId, input.mapLevelId],
          exact: true,
        });
      }, 1500);
    },
  });
}
