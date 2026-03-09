"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { CampaignPlayersResponse } from "@/types/api";

export function useCampaignPlayers(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<CampaignPlayersResponse>({
    queryKey: ["campaigns", campaignId, "players"],
    queryFn: () =>
      apiFetch<{ data: CampaignPlayersResponse }>(
        `/api/campaigns/${campaignId}/players`
      ).then((res) => res.data),
    enabled: !!campaignId,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  return {
    players: data?.players ?? [],
    hasActiveInvitation: data?.hasActiveInvitation ?? false,
    allReady: data?.allReady ?? false,
    playerCount: data?.playerCount ?? 0,
    isLoading: isPending,
    isError,
  };
}
