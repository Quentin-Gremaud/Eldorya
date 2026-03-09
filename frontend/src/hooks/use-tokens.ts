"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { createTokensApi } from "@/lib/api/tokens-api";
import type { Token } from "@/types/api";

export function useTokens(campaignId: string, mapLevelId: string | null) {
  const apiFetch = useApiClient();
  const api = createTokensApi(apiFetch);

  const query = useQuery<Token[]>({
    queryKey: ["tokens", campaignId, mapLevelId],
    queryFn: async () => {
      if (!mapLevelId) return [];
      const response = await api.getTokens(campaignId, mapLevelId);
      return response.data;
    },
    enabled: !!mapLevelId,
  });

  return {
    tokens: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
