"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CharacterDetailForGm } from "@/types/api";

export function useCharacterForGm(campaignId: string, characterId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<CharacterDetailForGm | null>({
    queryKey: ["campaigns", campaignId, "characters", characterId],
    queryFn: async () => {
      const res = await apiFetch<{ data: CharacterDetailForGm }>(
        `/api/campaigns/${campaignId}/characters/${characterId}`
      );
      return res.data;
    },
    enabled: !!campaignId && !!characterId,
    staleTime: 30_000,
  });

  return {
    character: data ?? null,
    isLoading: isPending,
    isError,
  };
}
