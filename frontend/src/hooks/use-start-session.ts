"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useApiClient } from "@/lib/api/use-api-client";
import { createSessionsApi } from "@/lib/api/sessions-api";
import type { Session } from "@/types/api";

interface StartSessionInput {
  campaignId: string;
  sessionId: string;
}

export function useStartSession() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const apiFetch = useApiClient();
  const api = createSessionsApi(apiFetch);

  return useMutation({
    mutationFn: async (input: StartSessionInput) => {
      await api.startSession(input.campaignId, {
        sessionId: input.sessionId,
      });
      return input;
    },

    onMutate: async (input) => {
      const queryKey = ["session", input.campaignId, "active"];
      await queryClient.cancelQueries({ queryKey });

      const previousSession = queryClient.getQueryData<Session | null>(queryKey);

      const optimistic: Session = {
        id: input.sessionId,
        campaignId: input.campaignId,
        gmUserId: userId ?? "",
        mode: "preparation",
        status: "active",
        startedAt: new Date().toISOString(),
        endedAt: null,
      };

      queryClient.setQueryData<Session | null>(queryKey, optimistic);

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
