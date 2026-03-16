"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createSessionsApi } from "@/lib/api/sessions-api";
import type { Session } from "@/types/api";

export function useActiveSession(campaignId: string) {
  const apiFetch = useApiClient();
  const api = createSessionsApi(apiFetch);

  const { data, isPending, isError } = useQuery<Session | null>({
    queryKey: ["session", campaignId, "active"],
    queryFn: () => api.getActiveSession(campaignId).then((res) => res.data),
    enabled: !!campaignId,
  });

  return {
    session: data ?? null,
    isLoading: isPending,
    isError,
  };
}
