"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createSessionsApi } from "@/lib/api/sessions-api";
import type { PipelineMode } from "@/types/api";

export function usePipelineMode(campaignId: string, sessionId: string) {
  const apiFetch = useApiClient();
  const api = createSessionsApi(apiFetch);

  const { data, isPending, isError } = useQuery<PipelineMode>({
    queryKey: ["session", campaignId, sessionId, "pipeline-mode"],
    queryFn: () =>
      api
        .getPipelineMode(campaignId, sessionId)
        .then((res) => res.data.pipelineMode),
    enabled: !!campaignId && !!sessionId,
  });

  return {
    pipelineMode: data ?? "optional",
    isLoading: isPending,
    isError,
  };
}
