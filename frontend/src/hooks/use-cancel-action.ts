"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createActionsApi } from "@/lib/api/actions-api";
import type { PendingAction } from "@/types/api";

interface CancelActionInput {
  campaignId: string;
  sessionId: string;
  actionId: string;
}

export function useCancelAction() {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();
  const api = createActionsApi(apiFetch);

  return useMutation({
    mutationFn: async (input: CancelActionInput) => {
      await api.cancelAction(
        input.campaignId,
        input.sessionId,
        input.actionId
      );
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

      queryClient.setQueryData<PendingAction[]>(queryKey, (old) =>
        (old ?? []).filter((a) => a.id !== input.actionId)
      );

      return { previousActions, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousActions);
      }
    },

    onSettled: (_data, _error, variables) => {
      if (variables) {
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: [
              "actions",
              variables.campaignId,
              variables.sessionId,
              "pending",
            ],
          });
        }, 1500);
      }
    },
  });
}
