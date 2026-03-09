"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";

interface CampaignDetails {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  gmDisplayName: string;
  playerCount: number;
  lastSessionDate: string | null;
  userRole: "gm" | "player";
  createdAt: string;
}

export function useCampaign(campaignId: string) {
  const apiFetch = useApiClient();

  const { data, isPending, isError } = useQuery<CampaignDetails>({
    queryKey: ["campaigns", campaignId],
    queryFn: () =>
      apiFetch<{ data: CampaignDetails }>(
        `/api/campaigns/${campaignId}`
      ).then((res) => res.data),
    enabled: !!campaignId,
    staleTime: 30_000,
  });

  return {
    campaign: data ?? null,
    isLoading: isPending,
    isError,
  };
}
