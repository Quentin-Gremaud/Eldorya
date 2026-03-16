"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createSessionsApi } from "@/lib/api/sessions-api";
import type { Session } from "@/types/api";

interface ChangeSessionModeInput {
  campaignId: string;
  sessionId: string;
  mode: "preparation" | "live";
}

export function useChangeSessionMode() {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();
  const api = createSessionsApi(apiFetch);

  return useMutation({
    mutationFn: async (input: ChangeSessionModeInput) => {
      await api.changeSessionMode(input.campaignId, input.sessionId, {
        mode: input.mode,
      });
      return input;
    },

    onMutate: async (input) => {
      const queryKey = ["session", input.campaignId, "active"];
      await queryClient.cancelQueries({ queryKey });

      const previousSession = queryClient.getQueryData<Session | null>(queryKey);

      if (previousSession) {
        queryClient.setQueryData<Session | null>(queryKey, {
          ...previousSession,
          mode: input.mode,
        });
      }

      return { previousSession, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousSession);
      }
    },

    onSettled: (_data, _error, variables) => {
      if (variables) {
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: ["session", variables.campaignId, "active"],
          });
        }, 1500);
      }
    },
  });
}
