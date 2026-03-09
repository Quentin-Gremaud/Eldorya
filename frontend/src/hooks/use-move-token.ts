"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createTokensApi } from "@/lib/api/tokens-api";
import { toast } from "sonner";
import type { Token } from "@/types/api";

interface MoveTokenInput {
  tokenId: string;
  mapLevelId: string;
  x: number;
  y: number;
}

export function useMoveToken(campaignId: string) {
  const apiFetch = useApiClient();
  const api = createTokensApi(apiFetch);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MoveTokenInput) =>
      api.moveToken(campaignId, input.tokenId, {
        x: input.x,
        y: input.y,
        commandId: crypto.randomUUID(),
      }),

    onMutate: async (input) => {
      const queryKey = ["tokens", campaignId, input.mapLevelId];

      await queryClient.cancelQueries({ queryKey, exact: true });

      const previousTokens = queryClient.getQueryData<Token[]>(queryKey);

      queryClient.setQueryData<Token[]>(queryKey, (old) =>
        (old ?? []).map((token) =>
          token.id === input.tokenId
            ? { ...token, x: input.x, y: input.y }
            : token
        )
      );

      return { previousTokens, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTokens) {
        queryClient.setQueryData(context.queryKey, context.previousTokens);
      }
      toast.error("Failed to move token");
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
