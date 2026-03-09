"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createTokensApi } from "@/lib/api/tokens-api";
import type { Token } from "@/types/api";
import { toast } from "sonner";

interface PlaceTokenInput {
  tokenId: string;
  mapLevelId: string;
  x: number;
  y: number;
  tokenType: string;
  label: string;
}

export function usePlaceToken(campaignId: string) {
  const apiFetch = useApiClient();
  const api = createTokensApi(apiFetch);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlaceTokenInput) =>
      api.placeToken(campaignId, {
        tokenId: input.tokenId,
        mapLevelId: input.mapLevelId,
        x: input.x,
        y: input.y,
        tokenType: input.tokenType,
        label: input.label,
        commandId: crypto.randomUUID(),
      }),

    onMutate: async (input) => {
      const queryKey = ["tokens", campaignId, input.mapLevelId];

      await queryClient.cancelQueries({ queryKey, exact: true });

      const previousTokens = queryClient.getQueryData<Token[]>(queryKey);

      const now = new Date().toISOString();
      const optimistic: Token = {
        id: input.tokenId,
        campaignId,
        mapLevelId: input.mapLevelId,
        x: input.x,
        y: input.y,
        tokenType: input.tokenType,
        label: input.label,
        createdAt: now,
        updatedAt: now,
      };

      queryClient.setQueryData<Token[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previousTokens, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTokens) {
        queryClient.setQueryData(context.queryKey, context.previousTokens);
      }
      toast.error("Failed to place token");
    },

    onSuccess: () => {
      toast.success("Token placed");
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
