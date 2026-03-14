"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createTokensApi } from "@/lib/api/tokens-api";
import type { Token } from "@/types/api";
import { toast } from "sonner";

interface LinkLocationTokenInput {
  tokenId: string;
  mapLevelId: string;
  destinationMapLevelId: string;
}

export function useLinkLocationToken(campaignId: string) {
  const apiFetch = useApiClient();
  const api = createTokensApi(apiFetch);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LinkLocationTokenInput) =>
      api.linkLocationToken(campaignId, input.tokenId, {
        destinationMapLevelId: input.destinationMapLevelId,
      }),

    onMutate: async (input) => {
      const queryKey = ["tokens", campaignId, input.mapLevelId];

      await queryClient.cancelQueries({ queryKey, exact: true });

      const previousTokens = queryClient.getQueryData<Token[]>(queryKey);

      queryClient.setQueryData<Token[]>(queryKey, (old) =>
        (old ?? []).map((t) =>
          t.id === input.tokenId
            ? { ...t, destinationMapLevelId: input.destinationMapLevelId }
            : t
        )
      );

      return { previousTokens, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTokens) {
        queryClient.setQueryData(context.queryKey, context.previousTokens);
      }
      toast.error("Failed to update location token destination");
    },

    onSuccess: () => {
      toast.success("Location token destination updated");
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
