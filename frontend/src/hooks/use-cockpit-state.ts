"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createSessionsApi } from "@/lib/api/sessions-api";
import type { CockpitState } from "@/types/api";

export function useCockpitState(campaignId: string, sessionId: string) {
  const apiFetch = useApiClient();
  const api = createSessionsApi(apiFetch);

  const { data, isPending, isError } = useQuery<CockpitState | null>({
    queryKey: ["cockpit", campaignId, sessionId],
    queryFn: () =>
      api.getCockpitState(campaignId, sessionId).then((res) => res.data),
    enabled: !!campaignId && !!sessionId,
    staleTime: 30_000,
  });

  return {
    cockpitState: data ?? null,
    isLoading: isPending,
    isError,
  };
}
