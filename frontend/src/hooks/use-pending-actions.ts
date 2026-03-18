"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createActionsApi } from "@/lib/api/actions-api";
import type { PendingAction } from "@/types/api";

export function usePendingActions(campaignId: string, sessionId: string) {
  const apiFetch = useApiClient();
  const api = createActionsApi(apiFetch);

  const { data, isPending, isError } = useQuery<PendingAction[]>({
    queryKey: ["actions", campaignId, sessionId, "pending"],
    queryFn: () =>
      api.getPendingActions(campaignId, sessionId).then((res) => res.data),
    enabled: !!campaignId && !!sessionId,
  });

  return {
    actions: data ?? [],
    isLoading: isPending,
    isError,
  };
}
