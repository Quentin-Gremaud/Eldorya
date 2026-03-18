"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createActionsApi } from "@/lib/api/actions-api";
import type { PingStatus } from "@/types/api";

export function usePingStatus(campaignId: string, sessionId: string) {
  const apiFetch = useApiClient();
  const api = createActionsApi(apiFetch);

  const { data, isPending, isError } = useQuery<PingStatus | null>({
    queryKey: ["actions", campaignId, sessionId, "ping-status"],
    queryFn: () =>
      api.getPingStatus(campaignId, sessionId).then((res) => res.data),
    enabled: !!campaignId && !!sessionId,
  });

  return {
    pingStatus: data ?? null,
    isLoading: isPending,
    isError,
  };
}
