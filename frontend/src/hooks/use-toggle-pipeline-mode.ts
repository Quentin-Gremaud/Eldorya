"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createSessionsApi } from "@/lib/api/sessions-api";
import type { PipelineMode } from "@/types/api";

interface TogglePipelineModeInput {
  campaignId: string;
  sessionId: string;
  pipelineMode: PipelineMode;
}

export function useTogglePipelineMode() {
  const queryClient = useQueryClient();
  const apiFetch = useApiClient();
  const api = createSessionsApi(apiFetch);

  return useMutation({
    mutationFn: async (input: TogglePipelineModeInput) => {
      await api.togglePipelineMode(input.campaignId, input.sessionId, {
        pipelineMode: input.pipelineMode,
      });
      return input;
    },

    onMutate: async (input) => {
      const queryKey = [
        "session",
        input.campaignId,
        input.sessionId,
        "pipeline-mode",
      ];
      await queryClient.cancelQueries({ queryKey });

      const previousMode = queryClient.getQueryData<PipelineMode>(queryKey);

      queryClient.setQueryData<PipelineMode>(queryKey, input.pipelineMode);

      return { previousMode, queryKey };
    },

    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousMode);
      }
    },

    onSettled: (_data, _error, variables) => {
      if (variables) {
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: [
              "session",
              variables.campaignId,
              variables.sessionId,
              "pipeline-mode",
            ],
          });
        }, 1500);
      }
    },
  });
}
