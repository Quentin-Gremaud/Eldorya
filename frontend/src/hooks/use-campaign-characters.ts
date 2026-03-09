"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CharacterSummary } from "@/types/api";

export function useCampaignCharacters(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<CharacterSummary[]>({
    queryKey: ["campaigns", campaignId, "characters"],
    queryFn: async () => {
      const res = await apiFetch<{ data: CharacterSummary[] }>(
        `/api/campaigns/${campaignId}/characters`
      );
      return res.data;
    },
    enabled: !!campaignId,
    staleTime: 30_000,
  });

  return {
    characters: data ?? [],
    isLoading: isPending,
    isError,
  };
}
