"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CharacterDetail } from "@/types/api";

export function useMyCharacter(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<CharacterDetail | null>({
    queryKey: ["campaigns", campaignId, "characters", "me"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ data: CharacterDetail }>(
          `/api/campaigns/${campaignId}/characters/me`
        );
        return res.data;
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 404
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!campaignId,
    staleTime: 30_000,
  });

  return {
    character: data ?? null,
    isLoading: isPending,
    isError,
  };
}
