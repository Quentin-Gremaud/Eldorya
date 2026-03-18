"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createActionsApi } from "@/lib/api/actions-api";
import type { PendingAction } from "@/types/api";

interface ValidateActionInput {
  campaignId: string;
  sessionId: string;
  actionId: string;
  narrativeNote?: string;
}

export function useValidateAction() {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();
  const api = createActionsApi(apiFetch);

  return useMutation({
    mutationFn: async (input: ValidateActionInput) => {
      await api.validateAction(input.campaignId, input.sessionId, input.actionId, {
        narrativeNote: input.narrativeNote,
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
  });
}
