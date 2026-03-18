"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createActionsApi } from "@/lib/api/actions-api";
import type { PendingAction, ActionType } from "@/types/api";

interface ProposeActionInput {
  campaignId: string;
  sessionId: string;
  actionId: string;
  actionType: ActionType;
  description: string;
  target?: string;
}

export function useProposeAction() {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();
  const api = createActionsApi(apiFetch);

  return useMutation({
    mutationFn: async (input: ProposeActionInput) => {
      await api.proposeAction(input.campaignId, input.sessionId, {
        actionId: input.actionId,
        actionType: input.actionType,
        description: input.description,
        target: input.target,
      });
      return input;
    },

    onMutate: async (input) => {
      const queryKey = [
        "actions",
        input.campaignId,
        input.sessionId,
        "pending",
      ];
      await queryClient.cancelQueries({ queryKey });

      const previousActions =
        queryClient.getQueryData<PendingAction[]>(queryKey);

      const optimisticAction: PendingAction = {
        id: input.actionId,
        sessionId: input.sessionId,
        campaignId: input.campaignId,
        playerId: "",
        actionType: input.actionType,
        description: input.description,
        target: input.target ?? null,
        status: "pending",
        proposedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PendingAction[]>(queryKey, (old) => [
        ...(old ?? []),
        optimisticAction,
      ]);

      return { previousActions, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousActions);
      }
    },

    onSettled: (_data, _error, variables) => {
      if (variables) {
        void queryClient.invalidateQueries({
          queryKey: [
            "actions",
            variables.campaignId,
            variables.sessionId,
            "pending",
          ],
        });
      }
    },
  });
}
