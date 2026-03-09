"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import { PlayerCampaign } from "@/types/api";

export function usePlayerCampaigns() {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<PlayerCampaign[]>({
    queryKey: ["campaigns", "player"],
    queryFn: () =>
      apiFetch<{ data: PlayerCampaign[] }>("/api/campaigns/player").then(
        (res) => res.data
      ),
    staleTime: 30_000,
  });

  return {
    campaigns: data ?? [],
    isLoading: isPending,
    isError,
  };
}
