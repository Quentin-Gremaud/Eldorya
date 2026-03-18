"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createActionsApi } from "@/lib/api/actions-api";
import type { PingStatus } from "@/types/api";

interface PingPlayerInput {
  campaignId: string;
  sessionId: string;
  playerId: string;
}

export function usePingPlayer() {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();
  const api = createActionsApi(apiFetch);

  return useMutation({
    mutationFn: async (input: PingPlayerInput) => {
      await api.pingPlayer(input.campaignId, input.sessionId, {
        playerId: input.playerId,
      });
      return input;
    },

    onMutate: async (input) => {
      const queryKey = [
        "actions",
        input.campaignId,
        input.sessionId,
        "ping-status",
      ];
      await queryClient.cancelQueries({ queryKey });

      const previousPingStatus =
        queryClient.getQueryData<PingStatus | null>(queryKey);

      const optimistic: PingStatus = {
        playerId: input.playerId,
        pingedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PingStatus | null>(queryKey, optimistic);

      return { previousPingStatus, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousPingStatus);
      }
    },

    onSettled: (_data, _error, variables) => {
      if (variables) {
        void queryClient.invalidateQueries({
          queryKey: [
            "actions",
            variables.campaignId,
            variables.sessionId,
            "ping-status",
          ],
        });
      }
    },
  });
}
