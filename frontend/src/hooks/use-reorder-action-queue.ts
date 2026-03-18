"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createActionsApi } from "@/lib/api/actions-api";
import type { PendingAction } from "@/types/api";

interface ReorderActionQueueInput {
  campaignId: string;
  sessionId: string;
  orderedActionIds: string[];
}

export function useReorderActionQueue() {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();
  const api = createActionsApi(apiFetch);

  return useMutation({
    mutationFn: async (input: ReorderActionQueueInput) => {
      await api.reorderActionQueue(input.campaignId, input.sessionId, {
        orderedActionIds: input.orderedActionIds,
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

      queryClient.setQueryData<PendingAction[]>(queryKey, (old) => {
        if (!old) return old;
        const actionMap = new Map(old.map((a) => [a.id, a]));
        return input.orderedActionIds
          .map((id) => actionMap.get(id))
          .filter((a): a is PendingAction => a !== undefined);
      });

      return { previousActions, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousActions);
      }
    },

    onSettled: (_data, _error, input) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["actions", input.campaignId, input.sessionId, "pending"],
        });
      }, 1500);
    },
  });
}
