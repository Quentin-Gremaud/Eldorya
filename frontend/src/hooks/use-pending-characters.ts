"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { PendingCharacterDetail } from "@/types/api";

export function usePendingCharacters(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<PendingCharacterDetail[]>({
    queryKey: ["campaigns", campaignId, "characters", "pending"],
    queryFn: async () => {
      const res = await apiFetch<{ data: PendingCharacterDetail[] }>(
        `/api/campaigns/${campaignId}/characters/pending`
      );
      return res.data;
    },
    enabled: !!campaignId,
    staleTime: 30_000,
  });

  return {
    pendingCharacters: data ?? [],
    isLoading: isPending,
    isError,
  };
}
